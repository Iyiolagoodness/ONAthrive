import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAdminUsers, updateUserRole } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Shield, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin — LogiLink" },
      { name: "description", content: "Manage LogiLink users and roles." },
    ],
  }),
  component: AdminUsers,
});

type UserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_type: string;
  kyc_status: string;
  verified: boolean;
  created_at: string;
};

function AdminUsers() {
  const fetchUsers = useServerFn(listAdminUsers);
  const mutateRole = useServerFn(updateUserRole);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 15;

  const load = async (p = page, q = search) => {
    setLoading(true);
    const res = await fetchUsers({ data: { page: p, pageSize, search: q || undefined } });
    setUsers(res.users as UserRow[]);
    const roleMap: Record<string, string[]> = {};
    (res.roles ?? []).forEach((r: any) => {
      roleMap[r.user_id] = [...(roleMap[r.user_id] ?? []), r.role];
    });
    setRoles(roleMap);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const toggleRole = async (userId: string, role: "admin" | "moderator" | "user", has: boolean) => {
    setBusyId(userId + role);
    try {
      await mutateRole({ data: { userId, role, action: has ? "remove" : "add" } });
      toast.success(has ? `Removed ${role} role` : `Added ${role} role`);
      await load(page, search);
    } catch (err: any) {
      toast.error(err.message || "Role update failed");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Users & Roles</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString()} registered users</p>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
            />
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">KYC</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const userRoles = roles[u.id] ?? [];
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                        <td className="px-4 py-3 capitalize">{u.user_type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.kyc_status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : u.kyc_status === "rejected"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {u.kyc_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {(["admin", "moderator", "user"] as const).map((role) => {
                              const has = userRoles.includes(role);
                              const Icon = role === "admin" ? Shield : User;
                              return (
                                <button
                                  key={role}
                                  disabled={busyId === u.id + role}
                                  onClick={() => toggleRole(u.id, role, has)}
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    has
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                      : "border border-border bg-background text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {busyId === u.id + role ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Icon className="h-3 w-3" />
                                  )}
                                  {role}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  load(p, search);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium disabled:opacity-50 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  load(p, search);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium disabled:opacity-50 hover:bg-muted"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
