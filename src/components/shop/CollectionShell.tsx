import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { CollectionGrid } from "./CollectionGrid";
import type { Product } from "@/lib/shop/types";
import { money } from "@/lib/shop/format";

export function CollectionShell({
  eyebrow,
  title,
  blurb,
  accent,
  products,
  guide,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  accent: string;
  products: Product[];
  guide?: ReactNode;
}) {
  const from = Math.min(...products.map((p) => p.price));
  const avgRating = products.reduce((s, p) => s + p.rating, 0) / (products.length || 1);

  return (
    <div className="relative">
      {/* colour wash behind the header */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] opacity-[0.14]"
        style={{ background: `radial-gradient(80% 100% at 20% 0%, ${accent}, transparent 70%)` }}
      />

      <div className="relative mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 md:pt-40">
        <Reveal>
          <nav className="mb-6 flex items-center gap-2 text-[12px] text-[rgba(13,22,16,.45)]">
            <Link href="/shop" className="hover:text-[var(--ink)]">
              Hlaza
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)]">{title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
            <div>
              <p className="eyebrow" style={{ color: accent }}>
                {eyebrow}
              </p>
              <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5rem)]">{title}</h1>
            </div>
            <div>
              <p className="max-w-sm text-[15px] leading-relaxed text-[rgba(13,22,16,.6)]">
                {blurb}
              </p>
              <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-[12px] uppercase tracking-[.14em] text-[rgba(13,22,16,.45)]">
                <span>
                  {products.length} lines · from{" "}
                  <span className="font-bold text-[var(--ink)]">{money(from)}</span>
                </span>
                <span>
                  Avg. <span className="font-bold text-[var(--ink)]">{avgRating.toFixed(1)}</span> ★
                </span>
                <Link
                  href="/shop/mix"
                  className="flex items-center gap-1.5 font-bold text-[var(--leaf)]"
                >
                  Build a mix <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-12">
          <CollectionGrid products={products} />
        </div>

        {guide ? <div className="mt-20">{guide}</div> : null}
      </div>
    </div>
  );
}
