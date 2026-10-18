import Link from "next/link";
import { DELIVERY } from "@/lib/shop/format";
import { LeafMark } from "./Header";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop/plants", label: "Living things" },
      { href: "/shop/nutrients", label: "Powdered nutrients" },
      { href: "/shop/substrate", label: "Substrate amendments" },
      { href: "/shop/collections", label: "Everything" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/shop/mix", label: "Mix Lab" },
      { href: "/shop/finder", label: "Plant finder" },
      { href: "/shop/cart", label: "Your bag" },
    ],
  },
  {
    title: "House",
    links: [
      { href: "/shop/about", label: "The greenhouse" },
      { href: "/shop/about#shipping", label: "Shipping & plant post" },
      { href: "/shop/about#guarantee", label: "The 14-day promise" },
    ],
  },
];

export function ShopFooter() {
  return (
    <footer className="relative overflow-hidden bg-[var(--moss-deep)] text-[var(--bone)]">
      {/* marquee ribbon */}
      <div className="marquee border-b border-white/10 py-3.5 text-[var(--lime)]">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {[
                "Peat-free since day one",
                "Grown in KwaZulu-Natal",
                "Plants shipped in sealed boxes",
                "Free delivery over R750",
                "14-day arrival promise",
                "Powders milled in small batches",
              ].map((t) => (
                <span key={t} className="flex items-center gap-6 px-6 text-[12px] font-bold uppercase tracking-[.22em]">
                  {t}
                  <span className="h-1 w-1 rounded-full bg-[var(--lime)]/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lime)] text-[var(--moss-deep)]">
              <LeafMark className="h-5 w-5" />
            </span>
            <span className="display text-[22px]">Hlaza</span>
          </div>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/60">
            Living things, powdered food and the parts of a good soil — sold separately, on purpose.
            Everything is blended and potted in KwaZulu-Natal and shipped across{" "}
            {DELIVERY.regions.length} provinces.
          </p>
          <p className="mt-6 text-[12px] uppercase tracking-[.18em] text-[var(--lime)]/80">
            Greenhouse · KwaDukuza, KZN
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-white/35">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="link-rule text-[13.5px] text-white/70 transition-colors hover:text-[var(--bone)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>© {new Date().getFullYear()} Hlaza Living Supply Co. Prices include VAT.</span>
          <span className="flex items-center gap-5">
            <span>Delivery {DELIVERY.leadTime}</span>
            <Link href="/" className="hover:text-white/70">
              Lease Sentinel suite ↗
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
