import type { Metadata } from "next";
import Link from "next/link";
import { CollectionShell } from "@/components/shop/CollectionShell";
import { Reveal } from "@/components/shop/Reveal";
import { CATEGORIES, byCategory } from "@/lib/shop/catalogue";

export const metadata: Metadata = {
  title: "Living things | Hlaza",
  description:
    "Pot plants grown and acclimatised in KwaZulu-Natal. Filter by light, difficulty and watering rhythm.",
};

const LEVELS = [
  { n: 1, label: "Shade-tolerant", text: "A dim corner, a north-facing bathroom, a desk two metres from a window." },
  { n: 3, label: "Bright, indirect", text: "A room that is genuinely bright but never gets direct sun on the leaves." },
  { n: 5, label: "Direct sun", text: "An east or west windowsill that takes real sun for a few hours." },
];

export default function PlantsPage() {
  const cat = CATEGORIES.plants;
  return (
    <CollectionShell
      eyebrow={cat.eyebrow}
      title="Living things"
      blurb={cat.blurb}
      accent={cat.accent}
      products={byCategory("plants")}
      guide={
        <div className="rounded-[28px] bg-[var(--moss-deep)] p-7 text-white md:p-12">
          <Reveal>
            <p className="eyebrow text-[var(--lime)]">How to read a light level</p>
            <h2 className="display mt-3 max-w-[18ch] text-[clamp(1.9rem,4vw,3rem)] text-white">
              Every listing tells you the truth about light.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {LEVELS.map((l, i) => (
              <Reveal key={l.n} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/12 bg-white/5 p-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, d) => (
                      <span
                        key={d}
                        className={`h-1.5 w-6 rounded-full ${d < l.n ? "bg-[var(--lime)]" : "bg-white/15"}`}
                      />
                    ))}
                  </div>
                  <p className="display mt-5 text-[21px] text-white">{l.label}</p>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/60">{l.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-[13.5px] text-white/45">
            Still unsure?{" "}
            <Link href="/shop/finder" className="text-[var(--lime)] underline underline-offset-4">
              Answer four questions
            </Link>{" "}
            and we will shortlist the ones that survive your actual room.
          </p>
        </div>
      }
    />
  );
}
