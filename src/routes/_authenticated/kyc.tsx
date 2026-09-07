import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyKyc, submitKyc } from "@/lib/kyc.functions";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  IdCard,
  Loader2,
  ScanFace,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Identity verification (KYC) — ONAthrive" },
      {
        name: "description",
        content:
          "Verify your identity on ONAthrive: NIN and facial verification for customers, plus driver's licence and vehicle registration for transporters.",
      },
      { property: "og:title", content: "Identity verification — ONAthrive" },
      { property: "og:description", content: "Complete KYC to ship or transport goods on ONAthrive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KycPage,
});

type Role = "customer" | "transporter";

async function fileToDataUrl(file: File, maxSize = 1400): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function KycPage() {
  const navigate = useNavigate();
  const loadStatus = useServerFn(getMyKyc);
  const send = useServerFn(submitKyc);

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<Awaited<ReturnType<typeof getMyKyc>> | null>(null);
  const [role, setRole] = useState<Role>("customer");

  const [nin, setNin] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [plate, setPlate] = useState("");
  const [license, setLicense] = useState<string | null>(null);
  const [vehicleReg, setVehicleReg] = useState<string | null>(null);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [liveness, setLiveness] = useState<{ frames: number; motionScore: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await loadStatus();
        setState(res);
        const t = res.profile?.user_type;
        setRole(t === "transporter" || t === "both" ? "transporter" : "customer");
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load your verification status");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pick(setter: (v: string) => void, file?: File | null) {
    if (!file) return;
    if (file.size > 12_000_000) return toast.error("Please choose an image under 12MB");
    try {
      setter(await fileToDataUrl(file));
    } catch {
      toast.error("Could not read that image");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selfie || !liveness) return toast.error("Complete the facial verification step first");
    setSubmitting(true);
    try {
      const res = await send({
        data: {
          userType: role,
          nin: nin.trim(),
          selfie,
          liveness,
          ...(role === "transporter"
            ? {
                driverLicenseNumber: licenseNo.trim(),
                vehicleRegNumber: vehicleRegNo.trim(),
                plateNumber: plate.trim() || undefined,
                license: license ?? undefined,
                vehicleReg: vehicleReg ?? undefined,
                portrait: portrait ?? undefined,
              }
            : {}),
        },
      });
      toast.success(
        res.faceCheckPassed
          ? "Submitted. Facial liveness passed — our team will confirm shortly."
          : "Submitted for review.",
      );
      const fresh = await loadStatus();
      setState(fresh);
    } catch (e: any) {
      const msg = String(e?.message ?? "Submission failed");
      toast.error(msg.includes("[") ? "Please check the highlighted fields and try again" : msg);
    }
    setSubmitting(false);
  }

  const status = state?.submission?.status ?? state?.profile?.kyc_status ?? "pending";
  const locked = status === "submitted" || status === "approved";

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading verification…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Identity verification</h1>
          <p className="text-sm text-muted-foreground">
            Verified accounts win more jobs and unlock escrow payouts.
          </p>
        </div>
      </div>

      <StatusBanner status={status} notes={state?.submission?.review_notes ?? null} />

      {locked ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            {status === "approved"
              ? "Your identity is verified. Nothing else to do here."
              : "We received your documents. Reviews usually complete within one business day."}
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Back to dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Who are you verifying as?</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(["customer", "transporter"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    role === r ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {r === "customer" ? "Customer — ship goods" : "Transporter — move goods"}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {r === "customer" ? "NIN + facial verification" : "NIN, licence, vehicle papers, photo + face"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <IdCard className="h-5 w-5 text-primary" /> National Identity Number (NIN)
            </h2>
            <input
              required
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
              placeholder="11-digit NIN"
              className="mt-3 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Stored securely and only visible to our compliance reviewers.
            </p>
          </section>

          {role === "transporter" && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Transporter documents</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Driver's licence number">
                  <input
                    required
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Vehicle registration number">
                  <input
                    required
                    value={vehicleRegNo}
                    onChange={(e) => setVehicleRegNo(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Plate number (optional)">
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <ImageUpload label="Driver's licence" value={license} onFile={(f) => pick(setLicense, f)} />
                <ImageUpload
                  label="Vehicle registration certificate"
                  value={vehicleReg}
                  onFile={(f) => pick(setVehicleReg, f)}
                />
                <ImageUpload label="Photo of transporter" value={portrait} onFile={(f) => pick(setPortrait, f)} />
              </div>
            </section>
          )}

          <FaceStep selfie={selfie} onCaptured={(img, live) => { setSelfie(img); setLiveness(live); }} />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Submit for verification
          </button>
        </form>
      )}
    </div>
  );
}

function StatusBanner({ status, notes }: { status: string; notes: string | null }) {
  const map: Record<string, { icon: any; text: string; cls: string }> = {
    pending: { icon: Clock, text: "Not verified yet — complete the steps below.", cls: "bg-muted text-muted-foreground" },
    submitted: { icon: Clock, text: "Under review by our compliance team.", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    approved: { icon: CheckCircle2, text: "Verified — your badge is live.", cls: "bg-primary/10 text-primary" },
    rejected: { icon: XCircle, text: notes || "Rejected — please resubmit with clearer documents.", cls: "bg-destructive/10 text-destructive" },
  };
  const s = map[status] ?? map["pending"]!;
  const Icon = s.icon;
  return (
    <div className={`mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium ${s.cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{s.text}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ImageUpload({
  label,
  value,
  onFile,
}: {
  label: string;
  value: string | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <label className="cursor-pointer">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background hover:bg-muted">
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <Upload className="h-4 w-4" /> Upload photo
          </span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function FaceStep({
  selfie,
  onCaptured,
}: {
  selfie: string | null;
  onCaptured: (img: string, liveness: { frames: number; motionScore: number }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640 } });
      streamRef.current = stream;
      setActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      toast.error("Camera access is required for facial verification");
    }
  }

  async function scan() {
    const video = videoRef.current;
    if (!video) return;
    setScanning(true);
    setProgress(0);

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 320) || 240;
    const ctx = canvas.getContext("2d")!;

    const frames = 8;
    let prev: Uint8ClampedArray | null = null;
    let motion = 0;

    for (let i = 0; i < frames; i++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      if (prev) {
        let diff = 0;
        for (let p = 0; p < px.length; p += 40) diff += Math.abs(px[p]! - prev[p]!);
        motion += diff / (px.length / 40) / 255;
      }
      prev = px;
      setProgress(Math.round(((i + 1) / frames) * 100));
      await new Promise((r) => setTimeout(r, 180));
    }

    const shot = document.createElement("canvas");
    shot.width = 640;
    shot.height = Math.round((video.videoHeight / video.videoWidth) * 640) || 480;
    shot.getContext("2d")!.drawImage(video, 0, 0, shot.width, shot.height);
    const img = shot.toDataURL("image/jpeg", 0.85);

    const motionScore = Math.min(1, motion / (frames - 1));
    setScanning(false);
    stop();

    if (motionScore < 0.02) {
      toast.error("We couldn't detect a live face — move slightly and try again");
      return;
    }
    onCaptured(img, { frames, motionScore });
    toast.success("Face captured");
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <ScanFace className="h-5 w-5 text-primary" /> Facial verification
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Look into the camera and blink or turn your head slightly while we capture a live frame.
      </p>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
        <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
          {selfie && !active ? (
            <img src={selfie} alt="Captured selfie" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          )}
          {scanning && (
            <div className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-1 text-center text-xs font-semibold">
              Scanning… {progress}%
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!active ? (
            <button
              type="button"
              onClick={start}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              <Camera className="h-4 w-4" /> {selfie ? "Retake face scan" : "Start face scan"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={scan}
                disabled={scanning}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
                Capture live face
              </button>
              <button
                type="button"
                onClick={stop}
                className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </>
          )}
          {selfie && !active && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Live face captured
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
