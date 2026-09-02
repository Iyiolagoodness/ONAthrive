import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const BUCKET = "kyc-documents";

const dataUrl = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/, "Only PNG, JPG or WebP images are accepted")
  .max(9_000_000, "Image is too large (max ~6MB)");

const submitSchema = z
  .object({
    userType: z.enum(["customer", "transporter"]),
    nin: z
      .string()
      .trim()
      .regex(/^\d{11}$/, "NIN must be exactly 11 digits"),
    driverLicenseNumber: z.string().trim().max(40).optional(),
    vehicleRegNumber: z.string().trim().max(40).optional(),
    plateNumber: z.string().trim().max(20).optional(),
    selfie: dataUrl,
    license: dataUrl.optional(),
    vehicleReg: dataUrl.optional(),
    portrait: dataUrl.optional(),
    liveness: z.object({ frames: z.number().int().min(1).max(60), motionScore: z.number().min(0).max(1) }),
  })
  .superRefine((v, ctx) => {
    if (v.userType !== "transporter") return;
    const required: Array<[keyof typeof v, string]> = [
      ["driverLicenseNumber", "Driver's licence number is required"],
      ["vehicleRegNumber", "Vehicle registration number is required"],
      ["license", "A photo of your driver's licence is required"],
      ["vehicleReg", "A photo of your vehicle registration certificate is required"],
      ["portrait", "A clear photo of the transporter is required"],
    ];
    for (const [key, message] of required) {
      if (!v[key]) ctx.addIssue({ code: "custom", path: [key as string], message });
    }
  });

function decode(url: string) {
  const [meta, b64] = url.split(",");
  const contentType = meta.slice(5, meta.indexOf(";"));
  const bin = atob(b64!);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return { bytes, contentType, ext };
}

export const getMyKyc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: submission } = await context.supabase
      .from("kyc_submissions")
      .select("id, user_type, status, review_notes, created_at, reviewed_at, face_check_passed")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("kyc_status, verified, user_type, full_name")
      .eq("id", context.userId)
      .maybeSingle();

    return { submission: submission ?? null, profile: profile ?? null };
  });

export const submitKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: existing } = await supabaseAdmin
      .from("kyc_submissions")
      .select("id, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && (existing.status === "submitted" || existing.status === "approved")) {
      throw new Error(
        existing.status === "approved" ? "Your identity is already verified." : "Your submission is already under review.",
      );
    }

    async function upload(kind: string, url?: string) {
      if (!url) return null;
      const { bytes, contentType, ext } = decode(url);
      const path = `${userId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
      if (error) throw new Error(`Could not upload ${kind}: ${error.message}`);
      return path;
    }

    const [selfiePath, licensePath, vehicleRegPath, portraitPath] = await Promise.all([
      upload("selfie", data.selfie),
      upload("license", data.license),
      upload("vehicle-registration", data.vehicleReg),
      upload("portrait", data.portrait),
    ]);

    const facePassed = data.liveness.frames >= 3 && data.liveness.motionScore >= 0.02;

    const { error } = await supabaseAdmin.from("kyc_submissions").insert({
      user_id: userId,
      user_type: data.userType,
      nin: data.nin,
      driver_license_number: data.driverLicenseNumber ?? null,
      vehicle_reg_number: data.vehicleRegNumber ?? null,
      plate_number: data.plateNumber ?? null,
      selfie_path: selfiePath!,
      license_path: licensePath,
      vehicle_reg_path: vehicleRegPath,
      portrait_path: portraitPath,
      face_match_score: data.liveness.motionScore,
      face_check_passed: facePassed,
      status: "submitted",
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("profiles").update({ kyc_status: "submitted" }).eq("id", userId);

    return { ok: true, faceCheckPassed: facePassed };
  });

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .limit(1);
  if (!roles || roles.length === 0) throw new Error("Forbidden: admin access required");
}

export const listKycSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: "submitted" | "approved" | "rejected" | "all" }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, phone, user_type, verified").in("id", userIds)
      : { data: [] as any[] };

    const signed = await Promise.all(
      (rows ?? []).map(async (r) => {
        const paths = [r.selfie_path, r.license_path, r.vehicle_reg_path, r.portrait_path].filter(Boolean) as string[];
        const urls: Record<string, string> = {};
        await Promise.all(
          paths.map(async (p) => {
            const { data: s } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(p, 60 * 15);
            if (s?.signedUrl) urls[p] = s.signedUrl;
          }),
        );
        const prof = (profiles ?? []).find((p: any) => p.id === r.user_id) ?? null;
        return {
          ...r,
          profile: prof,
          urls: {
            selfie: r.selfie_path ? urls[r.selfie_path] ?? null : null,
            license: r.license_path ? urls[r.license_path] ?? null : null,
            vehicleReg: r.vehicle_reg_path ? urls[r.vehicle_reg_path] ?? null : null,
            portrait: r.portrait_path ? urls[r.portrait_path] ?? null : null,
          },
        };
      }),
    );

    return { submissions: signed };
  });

export const reviewKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { submissionId: string; decision: "approved" | "rejected"; notes?: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub } = await supabaseAdmin
      .from("kyc_submissions")
      .select("id, user_id, user_type")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (!sub) throw new Error("Submission not found");

    const { error } = await supabaseAdmin
      .from("kyc_submissions")
      .update({
        status: data.decision,
        review_notes: data.notes?.trim() || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.submissionId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({
        kyc_status: data.decision,
        ...(data.decision === "approved" ? { verified: true } : {}),
      })
      .eq("id", sub.user_id);

    await supabaseAdmin.from("notifications").insert({
      user_id: sub.user_id,
      type: `kyc_${data.decision}`,
      title: data.decision === "approved" ? "Identity verified" : "Verification rejected",
      body:
        data.decision === "approved"
          ? "Your KYC documents were approved. Your account is now verified."
          : `Your KYC submission was rejected. ${data.notes?.trim() || "Please resubmit with clearer documents."}`,
      link: "/kyc",
    });

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: `kyc_${data.decision}`,
      target_user_id: sub.user_id,
      summary: `${data.decision === "approved" ? "Approved" : "Rejected"} KYC for ${sub.user_type}`,
      details: { submissionId: data.submissionId, notes: data.notes ?? null },
    });

    return { ok: true };
  });
