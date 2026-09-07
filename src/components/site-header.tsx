import { Link } from "@tanstack/react-router";
import { Moon, Sun, Menu, X, LayoutDashboard, Shield, IdCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notification-bell";



const navLinks = [
  { label: "Home", to: "/" },
  { label: "Marketplace", to: "/" },
  { label: "How It Works", to: "/" },
  { label: "Business", to: "/" },
  { label: "Pricing", to: "/" },
  { label: "About", to: "/" },
  { label: "Support", to: "/" },
];

export function SiteHeader() {
  const { theme, mounted, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      if (data.session?.user) checkAdmin(data.session.user.id);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
    setIsAdmin(!!data && data.length > 0);
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white" aria-hidden="true">
            <img src="/logo.png" alt="" className="absolute -left-1 -top-1 h-16 w-16 max-w-none" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">ONAthrive</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href="#"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {signedIn ? (
            <>
              <NotificationBell />
              <Link
                to="/kyc"
                className="hidden h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
              >
                <IdCard className="h-4 w-4" />
                Verify ID
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="hidden h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </>
          ) : (

            <>
              <Link
                to="/auth"
                className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
              >
                Login
              </Link>
              <Link
                to="/auth"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]"
              >
                Register
              </Link>
            </>
          )}

          <button
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((l) => (
              <a key={l.label} href="#" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                {l.label}
              </a>
            ))}
            <button
              onClick={toggle}
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Toggle theme
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
