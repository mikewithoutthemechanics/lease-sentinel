import type { Metadata } from "next";
import { CollectionShell } from "@/components/shop/CollectionShell";
import { Reveal } from "@/components/shop/Reveal";
import { CATEGORIES, byCategory } from "@/lib/shop/catalogue";

export const metadata: Metadata = {
  title: "Powdered nutrients | Hlaza",
  description:
    "Water-soluble nutrient powders milled for soft South African water. Growth, bloom, calcium-magnesium and biology.",
};

const STEPS = [
  {
    n: "01",
    title: "Fill the can first",
    text: "Water in the can, powder second. Adding powder to an empty can and then blasting it with a tap is how you get a clogged rose and a lumpy mess.",
  },
  {
    n: "02",
    title: "Dissolve, then pour",
    text: "Stir for twenty seconds. Every powder here is fully soluble — if it does not go clear, it is not our powder.",
  },
  {
    n: "03",
    title: "Feed wet roots",
    text: "Never feed a bone-dry medium. Water plain first if the pot has gone dust-dry, then feed an hour later.",
  },
  {
    n: "04",
    title: "Stop in winter",
    text: "From May to August on the coast, most houseplants are barely growing. Halve the dose or stop entirely.",
  },
];

export default function NutrientsPage() {
  const cat = CATEGORIES.nutrients;
  return (
    <CollectionShell
      eyebrow={cat.eyebrow}
      title="Powdered nutrients"
      blurb={cat.blurb}
      accent={cat.accent}
      products={byCategory("nutrients")}
      guide={
        <div>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow" style={{ color: cat.accent }}>
                  The method
                </p>
                <h2 className="display mt-3 max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">
                  Four habits that matter more than the brand.
                </h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07}>
                <div className="h-full rounded-2xl border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
                  <span className="display text-[13px] text-[var(--clay)]">{s.n}</span>
                  <h3 className="display mt-3 text-[20px] leading-tight">{s.title}</h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.6)]">
                    {s.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      }
    />
  );
}
