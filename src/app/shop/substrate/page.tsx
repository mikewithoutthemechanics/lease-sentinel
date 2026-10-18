import type { Metadata } from "next";
import Link from "next/link";
import { CollectionShell } from "@/components/shop/CollectionShell";
import { Reveal } from "@/components/shop/Reveal";
import { CATEGORIES, byCategory } from "@/lib/shop/catalogue";

export const metadata: Metadata = {
  title: "Substrate amendments | Hlaza",
  description:
    "Perlite, vermiculite, coir, worm castings and charged biochar. Buy the parts and build a mix that suits the plant.",
};

const AXES = [
  { key: "drainage", label: "Drainage", text: "How fast water leaves. Too slow and roots drown; too fast and you water every day." },
  { key: "aeration", label: "Aeration", text: "The pore space roots breathe through. The single thing most bagged soils get wrong." },
  { key: "moisture", label: "Moisture", text: "What the mix holds between waterings — your buffer against a hot week." },
  { key: "nutrition", label: "Nutrition", text: "Slow food held in the mix, quite separate from what you pour in from a tin." },
  { key: "biology", label: "Biology", text: "The living fraction. Invisible, and the reason a mix stays healthy for years." },
];

export default function SubstratePage() {
  const cat = CATEGORIES.substrate;
  return (
    <CollectionShell
      eyebrow={cat.eyebrow}
      title="Substrate amendments"
      blurb={cat.blurb}
      accent={cat.accent}
      products={byCategory("substrate")}
      guide={
        <div className="rounded-[28px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-7 md:p-12">
          <Reveal>
            <p className="eyebrow" style={{ color: cat.accent }}>
              The five axes
            </p>
            <h2 className="display mt-3 max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">
              A mix is a position on five sliding scales.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(13,22,16,.6)]">
              Every amendment below moves those scales in a known direction. Coir buys moisture,
              perlite buys air, castings buy food, biochar buys a decade of stability. The Mix Lab
              does the arithmetic; this table explains what it is actually trading off.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {AXES.map((a, i) => (
              <Reveal key={a.key} delay={i * 0.06}>
                <div className="h-full rounded-2xl bg-[var(--bone)] p-5">
                  <p className="text-[12px] font-bold uppercase tracking-[.14em] text-[var(--leaf)]">
                    {a.label}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-[rgba(13,22,16,.6)]">
                    {a.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--moss-deep)] px-7 py-6 text-white">
            <p className="max-w-xl text-[14px] leading-relaxed text-white/70">
              Or skip the reading. Tell the Lab which plant and how big the pot is, and it will hand
              you the exact litres in the exact ratio.
            </p>
            <Link
              href="/shop/mix"
              className="ml-auto inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[var(--lime)] px-6 text-[14px] font-bold text-[var(--moss-deep)]"
            >
              Open the Mix Lab →
            </Link>
          </div>
        </div>
      }
    />
  );
}
