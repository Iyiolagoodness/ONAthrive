export function SiteFooter() {
  const cols = [
    {
      title: "Company",
      links: ["About", "Careers", "Blog", "Press"],
    },
    {
      title: "Product",
      links: ["Ship a Package", "Become a Transporter", "Business", "Pricing"],
    },
    {
      title: "Support",
      links: ["Help Center", "Contact", "Safety", "FAQs"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Cookies", "Compliance"],
    },
  ];

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white" aria-hidden="true">
                <img src="/logo.png" alt="" className="absolute -left-1 -top-1 h-16 w-16 max-w-none" />
              </span>
              <span className="font-display text-xl font-bold">ONAthrive</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Africa's trusted digital logistics marketplace. Compare verified transporters, pay securely with escrow, and track every shipment in real time.
            </p>
            <form className="mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="you@company.com"
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary focus:ring-2"
              />
              <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Subscribe
              </button>
            </form>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ONAthrive Technologies. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Twitter</a>
            <a href="#" className="hover:text-foreground">LinkedIn</a>
            <a href="#" className="hover:text-foreground">Instagram</a>
            <a href="#" className="hover:text-foreground">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
