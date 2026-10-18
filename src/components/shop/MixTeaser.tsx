"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RECIPES, getProduct } from "@/lib/shop/catalogue";

const ORDER = ["coco-coir", "perlite", "vermiculite", "worm-castings", "biochar"];

const METRICS = ["drainage", "aeration", "moisture", "nutrition", "biology"] as const;

export function MixTeaser() {
  const [i, setI] = useState(4);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % RECIPES.length), 2800);
    return () => clearInterval(t);
  }, [paused, i]);

  const recipe = RECIPES[i];
  const entries = ORDER.filter((s) => (recipe.mix[s] ?? 0) > 0);

  const metrics = METRICS.map((key) => {
    const total = entries.reduce((n, s) => n + (recipe.mix[s] ?? 0), 0) || 1;
    return {
      key,
      value: entries.reduce((n, s) => {
        const p = getProduct(s);
        return n + (p?.metrics?.[key] ?? 0) * ((recipe.mix[s] ?? 0) / total);
      }, 0),
    };
  });

  return (
    <Link
      href="/shop/mix"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative block overflow-hidden rounded-[28px] bg-[var(--moss-deep)] p-7 text-[var(--bone)] md:p-10"
    >
      <div className="absolute inset-0 opacity-25">
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #d7e86b, transparent 70%)" }}
        />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="eyebrow text-[var(--lime)]">The Mix Lab</p>
          <h2 className="display mt-3 max-w-[16ch] text-[clamp(2rem,4.6vw,3.4rem)] text-white">
            Soil is arithmetic. We did the sums.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/62">
            Choose a plant and a pot size. Move four sliders. We will tell you how many litres to
            buy, in what ratio, and how many grams of powder to stir into each can.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--lime)] px-6 text-[14px] font-bold text-[var(--moss-deep)]">
              Open the Lab
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-[12.5px] text-white/45">No account needed</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* animated column */}
          <div className="relative h-[240px] w-[92px] overflow-hidden rounded-[22px] border border-white/15 bg-white/5">
            <div className="absolute inset-0 flex flex-col-reverse">
              {entries.map((slug) => {
                const p = getProduct(slug)!;
                return (
                  <motion.div
                    key={slug}
                    animate={{ height: `${recipe.mix[slug]}%` }}
                    transition={
                      reduce ? { duration: 0 } : { type: "spring", stiffness: 100, damping: 18 }
                    }
                    style={{
                      background: `linear-gradient(140deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                    }}
                    className="w-full"
                  />
                );
              })}
            </div>
          </div>

          <div className="w-[200px]">
            <p className="display text-[19px] text-white">{recipe.name}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/50">{recipe.note}</p>
            <div className="mt-5 space-y-2.5">
              {metrics.map((m) => (
                <div key={m.key}>
                  <div className="flex justify-between text-[10.5px] uppercase tracking-[.14em] text-white/45">
                    <span>{m.key}</span>
                    <span className="tabular-nums">{Math.round(m.value * 100)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/12">
                    <motion.div
                      className="h-full rounded-full bg-[var(--lime)]"
                      animate={{ width: `${m.value * 100}%` }}
                      transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 20 }
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
