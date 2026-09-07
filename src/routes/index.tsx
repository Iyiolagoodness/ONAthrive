import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  MapPin,
  Wallet,
  Star,
  Zap,
  Users,
  Globe2,
  Search,
  Package,
  Handshake,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "LogiLink — Move Anything Across Nigeria With Trusted Transporters" },
      {
        name: "description",
        content:
          "Post a shipment, compare verified transporters, pay securely with escrow, and track deliveries in real time. Nigeria's trusted digital logistics marketplace.",
      },
      { property: "og:title", content: "LogiLink — Nigeria's Trusted Logistics Marketplace" },
      {
        property: "og:description",
        content:
          "Compare prices, hire verified drivers, pay with escrow, and track every shipment in real time.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "LogiLink — Trusted Logistics for Nigeria" },
      {
        name: "twitter:description",
        content: "Post. Compare. Ship. Track. All in one marketplace.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const NIGERIAN_STATES = [
  "Lagos","FCT-Abuja","Kano","Rivers","Oyo","Kaduna","Ogun","Anambra","Enugu","Delta","Edo","Cross River","Akwa Ibom","Imo","Abia","Ondo","Osun","Ekiti","Plateau","Bauchi","Sokoto","Kwara","Benue","Nasarawa","Niger","Kebbi","Adamawa","Borno","Yobe","Taraba","Gombe","Jigawa","Katsina","Zamfara","Kogi","Ebonyi","Bayelsa",
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      {/* <TrustedBy /> */}
      <HowItWorks />
      <MarketplaceFeed />
      <WhyChooseUs />
      <Testimonials />
      <Coverage />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* -------------------- HERO -------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 10%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 60%), radial-gradient(50% 40% at 85% 20%, color-mix(in oklab, var(--success) 25%, transparent), transparent 60%), radial-gradient(50% 40% at 50% 100%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI-matched transporters · Escrow-protected payments
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Move Anything Across Nigeria With{" "}
            <span className="bg-gradient-to-br from-primary to-success bg-clip-text text-transparent">
              Trusted Transporters
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Compare prices, hire verified drivers, pay securely with escrow, and track deliveries
            in real time — all in one marketplace built for Africa.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]"
            >
              Ship a Package <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Truck className="h-4 w-4" /> Become a Transporter
            </a>
          </div>
        </div>

        {/* Quick search card */}
        <div className="mx-auto mt-12 max-w-5xl rounded-2xl border border-border bg-card/80 p-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <SearchField icon={<MapPin className="h-4 w-4" />} label="Pickup State">
              <select className="w-full bg-transparent text-sm outline-none">
                {NIGERIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </SearchField>
            <SearchField icon={<MapPin className="h-4 w-4 rotate-180 text-success" />} label="Destination">
              <select className="w-full bg-transparent text-sm outline-none">
                {NIGERIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </SearchField>
            <SearchField icon={<Package className="h-4 w-4" />} label="Package Type">
              <select className="w-full bg-transparent text-sm outline-none">
                <option>Small parcel</option>
                <option>Furniture</option>
                <option>Electronics</option>
                <option>Food & farm produce</option>
                <option>Vehicle</option>
                <option>Full truck load</option>
              </select>
            </SearchField>
            <button className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.02]">
              <Search className="h-4 w-4" /> Find Transporters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value="12,400+" label="Verified Drivers" />
          <Stat value="3,120" label="Active Shipments" />
          <Stat value="36" label="States Covered" />
          <Stat value="184K" label="Deliveries Completed" />
        </div>
      </div>
    </section>
  );
}

function SearchField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-xl border border-border bg-background px-4">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex flex-1 flex-col overflow-hidden">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {children}
      </span>
    </label>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 text-center backdrop-blur">
      <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

/* -------------------- TRUSTED BY -------------------- */

// function TrustedBy() {
//   const names = ["JumiaLogistics", "GIG Freight", "Konga Xpress", "MTN Business", "Interswitch", "Flutterwave", "Dangote SCM"];
//   return (
//     <section className="border-y border-border bg-secondary/30 py-10">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//           Trusted by leading businesses across Nigeria
//         </p>
//         <div className="mt-6 grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-4 lg:grid-cols-7">
//           {names.map((n) => (
//             <div key={n} className="text-center font-display text-sm font-semibold text-muted-foreground">
//               {n}
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

/* -------------------- HOW IT WORKS -------------------- */

function HowItWorks() {
  const steps = [
    { icon: <Package className="h-5 w-5" />, title: "Create Shipment", desc: "Tell us what you're moving, from where to where." },
    { icon: <Users className="h-5 w-5" />, title: "Receive Bids", desc: "Verified transporters compete with real offers." },
    { icon: <Handshake className="h-5 w-5" />, title: "Compare & Choose", desc: "Pick the best based on price, rating and trust score." },
    { icon: <CreditCard className="h-5 w-5" />, title: "Pay Securely", desc: "Money is held safely in escrow until delivery." },
    { icon: <CheckCircle2 className="h-5 w-5" />, title: "Track to Delivery", desc: "Live GPS updates from pickup to drop-off." },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How It Works" title="Ship in five simple steps" desc="Built to eliminate the guesswork, fraud and stress of Nigerian logistics." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground">
                STEP {i + 1}
              </div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {s.icon}
              </div>
              <h3 className="font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- MARKETPLACE FEED -------------------- */

function MarketplaceFeed() {
  const posts = [
    { type: "Need truck", from: "Lagos", to: "Kano", vehicle: "10-tonne truck", price: "₦380,000", who: "Adaeze O.", verified: true, tag: "Bidding open" },
    { type: "Empty truck", from: "Abuja", to: "Port Harcourt", vehicle: "20ft flatbed", price: "₦210,000", who: "SwiftMove Ltd", verified: true, tag: "Departs Fri" },
    { type: "Van available", from: "Ibadan", to: "Lagos", vehicle: "Mini van", price: "₦42,000", who: "Tunde A.", verified: false, tag: "Same day" },
    { type: "Cold-chain", from: "Jos", to: "Abuja", vehicle: "Refrigerated truck", price: "₦140,000", who: "IceHaul Nigeria", verified: true, tag: "Farm produce" },
    { type: "Bike dispatch", from: "Lekki", to: "Yaba", vehicle: "Dispatch bike", price: "₦4,500", who: "Chuka M.", verified: true, tag: "Within 90 min" },
    { type: "Container haul", from: "Apapa Port", to: "Onitsha", vehicle: "40ft container truck", price: "₦620,000", who: "PortLink Logistics", verified: true, tag: "Weekly" },
  ];
  return (
    <section className="border-y border-border bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Live Marketplace"
          title="Every shipment. Every route. In real time."
          desc="Post a request, or browse routes that transporters are actively running."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <div key={i} className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {p.type}
                </span>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent-foreground/80">
                  {p.tag}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 font-display text-lg font-semibold">
                <span>{p.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{p.to}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{p.vehicle}</div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                    {p.who.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      {p.who}
                      {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Trust score 92 · 4.9 ★</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">{p.price}</div>
                  <div className="text-[11px] text-muted-foreground">est. price</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  Place a bid
                </button>
                <button className="rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted">
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- WHY CHOOSE US -------------------- */

function WhyChooseUs() {
  const items = [
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Verified Drivers", desc: "KYC, license and vehicle checks on every transporter." },
    { icon: <Wallet className="h-5 w-5" />, title: "Escrow Payments", desc: "Your money is only released when goods are delivered." },
    { icon: <MapPin className="h-5 w-5" />, title: "Live Tracking", desc: "See exactly where your shipment is, minute by minute." },
    { icon: <Users className="h-5 w-5" />, title: "24/7 Support", desc: "Real humans, real response times, across Nigeria." },
    { icon: <Zap className="h-5 w-5" />, title: "AI Matching", desc: "Best transporter recommended in seconds." },
    { icon: <Truck className="h-5 w-5" />, title: "Every Vehicle", desc: "Bikes, vans, trucks, containers, cold-chain and more." },
    { icon: <Globe2 className="h-5 w-5" />, title: "Nationwide Coverage", desc: "From Lagos to Yola — all 36 states plus FCT." },
    { icon: <Sparkles className="h-5 w-5" />, title: "Fraud Protection", desc: "AI detects suspicious activity and freezes payments." },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why LogiLink"
          title="A logistics platform built like a fintech"
          desc="Every feature is designed around safety, transparency and speed."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-elegant)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- TESTIMONIALS -------------------- */

function Testimonials() {
  const reviews = [
    {
      name: "Chinelo E.",
      role: "Instagram vendor, Lagos",
      quote: "I used to lose money to random drivers. On LogiLink, I compare 5 transporters in minutes and my customers get their orders on time.",
      rating: 5,
    },
    {
      name: "Ibrahim K.",
      role: "Fleet owner, Kano",
      quote: "Bidding for jobs is transparent. I've grown my monthly revenue by 40% since joining, and payments always arrive.",
      rating: 5,
    },
    {
      name: "Ngozi A.",
      role: "Operations Lead, Abuja",
      quote: "Escrow gave our finance team confidence. Live tracking gave our clients peace of mind. It's the fintech version of logistics.",
      rating: 5,
    },
  ];
  return (
    <section className="border-y border-border bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Testimonials" title="Loved by shippers and drivers" />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                "{r.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success font-mono text-sm font-bold text-primary-foreground">
                  {r.name.split(" ").map((x) => x[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- COVERAGE -------------------- */

function Coverage() {
  const hubs = [
    { name: "Lagos", drivers: "3,200+" },
    { name: "FCT-Abuja", drivers: "1,850+" },
    { name: "Port Harcourt", drivers: "980+" },
    { name: "Kano", drivers: "820+" },
    { name: "Ibadan", drivers: "760+" },
    { name: "Onitsha", drivers: "540+" },
    { name: "Benin", drivers: "410+" },
    { name: "Aba", drivers: "390+" },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Coverage"
              title="36 states. One marketplace."
              align="left"
              desc="From Apapa Port to Maiduguri, our network connects verified transporters in every corner of Nigeria — and ECOWAS routes are coming next."
            />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {hubs.map((h) => (
                <div key={h.name} className="rounded-xl border border-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">{h.name}</div>
                  <div className="font-mono text-sm font-bold">{h.drivers}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-success/10 p-6">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 40%, color-mix(in oklab, var(--primary) 40%, transparent) 0 2px, transparent 3px), radial-gradient(circle at 55% 25%, color-mix(in oklab, var(--success) 50%, transparent) 0 2px, transparent 3px), radial-gradient(circle at 68% 55%, color-mix(in oklab, var(--accent) 55%, transparent) 0 3px, transparent 4px), radial-gradient(circle at 42% 68%, color-mix(in oklab, var(--primary) 40%, transparent) 0 2px, transparent 3px), radial-gradient(circle at 22% 75%, color-mix(in oklab, var(--primary) 40%, transparent) 0 2px, transparent 3px)",
                backgroundSize: "100% 100%",
              }}
            />
            <div className="relative flex h-full items-center justify-center">
              <div className="rounded-2xl border border-border bg-card/80 p-6 text-center shadow-[var(--shadow-elegant)] backdrop-blur">
                <Globe2 className="mx-auto h-8 w-8 text-primary" />
                <div className="mt-3 font-display text-2xl font-bold">Nigeria & beyond</div>
                <div className="mt-1 text-sm text-muted-foreground">Live routes across 36 states + FCT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- PRICING -------------------- */

function Pricing() {
  const tiers = [
    {
      name: "Pay as you ship",
      price: "10%",
      priceNote: "commission per delivery",
      desc: "Perfect for individuals and occasional shippers.",
      features: ["Escrow protection", "Live tracking", "Verified transporters", "24/7 chat support"],
      cta: "Ship a package",
      featured: false,
    },
    {
      name: "Business",
      price: "₦25,000",
      priceNote: "/month + 6% commission",
      desc: "For SMEs shipping regularly and needing analytics.",
      features: ["Bulk shipment upload", "Team accounts", "Invoicing & reports", "Priority support", "Lower commission"],
      cta: "Start business trial",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      priceNote: "billed monthly",
      desc: "Fleet & logistics companies with high volume.",
      features: ["API access", "Dedicated manager", "Fleet dashboard", "Custom SLAs", "White-label options"],
      cta: "Talk to sales",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="border-y border-border bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Pricing" title="Transparent, competitive, no surprises" desc="Only pay when a delivery is completed. No sign-up fees, ever." />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 ${
                t.featured
                  ? "border-primary bg-gradient-to-b from-primary/5 to-transparent shadow-[var(--shadow-elegant)]"
                  : "border-border bg-card"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.priceNote}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-lg py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                  t.featured
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- FAQ -------------------- */

function FAQ() {
  const faqs = [
    {
      q: "How does escrow protect my payment?",
      a: "When you pay for a shipment, LogiLink holds the money securely. The transporter only receives payment after you confirm delivery — or automatically after 72 hours if there are no disputes.",
    },
    {
      q: "How do you verify transporters?",
      a: "Every transporter passes KYC checks, driver license verification, NIN validation, vehicle registration and insurance review before being listed. Every completed delivery updates their trust score.",
    },
    {
      q: "What if my goods are damaged or lost?",
      a: "You can open a dispute directly from the app. Escrow is frozen while our support team investigates, and optional insurance covers full replacement value on qualifying shipments.",
    },
    {
      q: "Can businesses integrate LogiLink with their store?",
      a: "Yes — our Business and Enterprise plans include API access, so you can create shipments, receive tracking updates and manage returns straight from your e-commerce platform.",
    },
    {
      q: "What states do you cover?",
      a: "All 36 states of Nigeria plus the FCT. Cross-border ECOWAS delivery is on our roadmap for the next phase.",
    },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Questions? We've got answers." />
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((f, i) => (
            <button
              key={i}
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full px-6 py-5 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-base font-semibold">{f.q}</span>
                <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </div>
              {open === i && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- FINAL CTA -------------------- */

function FinalCTA() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-success p-10 text-primary-foreground shadow-[var(--shadow-elegant)] sm:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, white 0 2px, transparent 3px), radial-gradient(circle at 80% 70%, white 0 2px, transparent 3px)",
              backgroundSize: "180px 180px, 220px 220px",
            }}
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Ready to move your goods safely?
              </h2>
              <p className="mt-4 max-w-lg text-primary-foreground/90">
                Join thousands of shippers and drivers using LogiLink every day. It takes 60 seconds to get your first bid.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-transform hover:scale-[1.03]"
              >
                Start shipping <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 bg-primary-foreground/10 px-6 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/20"
              >
                Join as driver
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Shared -------------------- */

function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-base text-muted-foreground">{desc}</p>}
    </div>
  );
}
