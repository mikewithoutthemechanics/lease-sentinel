import type { Metadata } from "next";
import Link from "next/link";
import { MixLab } from "@/components/shop/MixLab";
import { Reveal } from "@/components/shop/Reveal";
import { RECIPES } from "@/lib/shop/catalogue";

export const metadata: Metadata = {
  title: "Mix Lab | Hlaza",
  description:
    "Build a substrate recipe and a feeding schedule. Choose a plant and pot size, move the sliders, and buy exactly the litres and grams you need.",
};

export default function MixPage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[var(--moss-deep)]" />
      <div className="absolute inset-x-0 top-0 h-[520px] opacity-30">
        <div
          className="absolute -left-40 top-0 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #d7e86b55, transparent 70%)" }}
        />
        <div
          className="absolute right-0 top-40 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #33684c88, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 pb-8 pt-28 text-white md:px-8 md:pt-36">
        <Reveal>
          <p className="eyebrow text-[var(--lime)]">The Mix Lab</p>
          <h1 className="display mt-4 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] text-white">
            Stop guessing at the soil.
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/65">
            Tell the Lab what you are potting and how big the pot is. It will work out the litres,
            the ratio, the pH and the grams of powder per can — then put the exact bags in your box.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap gap-2.5">
          {RECIPES.map((r) => (
            <span
              key={r.name}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12.5px] font-semibold text-white/75 backdrop-blur"
            >
              {r.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <MixLab />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-20 md:px-8">
        <Reveal>
          <div className="rounded-[28px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-7 md:p-10">
            <p className="eyebrow text-[rgba(13,22,16,.4)]">Why we sell the parts</p>
            <h2 className="display mt-3 max-w-[22ch] text-[clamp(1.7rem,3.6vw,2.6rem)]">
              A bag of “potting soil” is a compromise dressed up as a convenience.
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  t: "One mix cannot serve a ZZ and a fern",
                  d: "A plant that stores water in its rhizomes wants drainage. A fern wants the opposite. The bag in the middle is wrong for both.",
                },
                {
                  t: "Your room is part of the recipe",
                  d: "A hot north-facing flat dries a pot in three days. A cool bathroom takes two weeks. Same plant, different mix.",
                },
                {
                  t: "Amendments do not expire",
                  d: "Buy the parts once and you are set for a season of repotting. No half-used bags of the wrong thing under the sink.",
                },
              ].map((item, i) => (
                <Reveal key={item.t} delay={i * 0.08}>
                  <div>
                    <p className="display text-[19px] leading-tight">{item.t}</p>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.6)]">
                      {item.d}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Link
              href="/shop/substrate"
              className="mt-9 inline-flex h-12 items-center rounded-full bg-[var(--moss)] px-7 text-[14px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
            >
              Browse the soil bar
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
