"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplets, FlaskConical, Info, Leaf, RotateCcw, Sparkles, Wind } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PRODUCTS, RECIPES, getProduct } from "@/lib/shop/catalogue";
import { DELIVERY, grams as fmtGrams, money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";

const BASES = ["coco-coir", "perlite", "vermiculite", "worm-castings", "biochar"] as const;
const FEEDS = ["grow-20-10-20", "bloom-10-30-20", "cal-mag", "kelp-extract"] as const;

type Parts = Record<string, number>;

const IDEAL: Record<string, Record<string, number>> = {
  "monstera-albo": { drainage: 0.75, aeration: 0.8, moisture: 0.45, nutrition: 0.55, biology: 0.5 },
  "fiddle-leaf-fig": { drainage: 0.6, aeration: 0.6, moisture: 0.65, nutrition: 0.6, biology: 0.5 },
  "strelitzia-nicolai": { drainage: 0.55, aeration: 0.5, moisture: 0.7, nutrition: 0.7, biology: 0.55 },
  "philodendron-pink-princess": { drainage: 0.7, aeration: 0.75, moisture: 0.5, nutrition: 0.5, biology: 0.5 },
  "zz-raven": { drainage: 0.85, aeration: 0.8, moisture: 0.3, nutrition: 0.4, biology: 0.35 },
};

const DEFAULT_IDEAL = { drainage: 0.6, aeration: 0.6, moisture: 0.6, nutrition: 0.6, biology: 0.55 };

const KEY_LABEL: Record<string, string> = {
  drainage: "Drainage",
  aeration: "Aeration",
  moisture: "Moisture",
  nutrition: "Nutrition",
  biology: "Biology",
};

function potLitres(diameterCm: number) {
  // Cylinder pot, height ≈ diameter, 85 % filled with medium.
  const r = diameterCm / 2;
  return (Math.PI * r * r * diameterCm) / 1000 * 0.85;
}

export function MixLab() {
  const { add } = useCart();
  const reduce = useReducedMotion();

  const [parts, setParts] = useState<Parts>({
    "coco-coir": 40,
    perlite: 20,
    vermiculite: 10,
    "worm-castings": 20,
    biochar: 10,
  });
  const [plant, setPlant] = useState<string>("monstera-albo");
  const [diameter, setDiameter] = useState(22);
  const [pots, setPots] = useState(2);
  const [stage, setStage] = useState<"seedling" | "veg" | "bloom">("veg");
  const [waterings, setWaterings] = useState(1);
  const [activeFeeds, setActiveFeeds] = useState<string[]>(["grow-20-10-20", "cal-mag"]);
  const [recipeName, setRecipeName] = useState<string | null>("Balanced Houseplant");

  const total = Object.values(parts).reduce((a, b) => a + b, 0) || 1;
  const pct = useMemo(() => {
    const out: Parts = {};
    for (const k of Object.keys(parts)) out[k] = parts[k] / total;
    return out;
  }, [parts, total]);

  const metrics = useMemo(() => {
    const acc = { drainage: 0, aeration: 0, moisture: 0, nutrition: 0, biology: 0 };
    let ph = 0;
    for (const slug of BASES) {
      const p = getProduct(slug);
      if (!p?.metrics || !p.amendment) continue;
      const w = pct[slug] ?? 0;
      acc.drainage += p.metrics.drainage * w;
      acc.aeration += p.metrics.aeration * w;
      acc.moisture += p.metrics.moisture * w;
      acc.nutrition += p.metrics.nutrition * w;
      acc.biology += p.metrics.biology * w;
      ph += p.amendment.ph * w;
    }
    return { ...acc, ph };
  }, [pct]);

  const match = useMemo(() => {
    const ideal = IDEAL[plant] ?? DEFAULT_IDEAL;
    const keys = Object.keys(ideal);
    const diff =
      keys.reduce((sum, k) => sum + Math.abs(metrics[k as keyof typeof metrics] - ideal[k]), 0) /
      keys.length;
    return Math.max(0, Math.min(100, Math.round((1 - diff * 2.1) * 100)));
  }, [metrics, plant]);

  const litres = potLitres(diameter) * pots;

  const packs = useMemo(() => {
    return BASES.map((slug) => {
      const p = getProduct(slug)!;
      const share = pct[slug] ?? 0;
      const needed = litres * share;
      const qty = share > 0.001 ? Math.max(1, Math.ceil(needed / (p.amendment?.litres ?? 1))) : 0;
      return { product: p, share, needed, qty, cost: qty * p.price };
    }).filter((row) => row.qty > 0);
  }, [pct, litres]);

  const mixCost = packs.reduce((s, r) => s + r.cost, 0);

  const feedPlan = useMemo(() => {
    const litresPerWatering = potLitres(diameter) * 0.25 * pots;
    const litresPerWeek = litresPerWatering * waterings;
    return FEEDS.map((slug) => {
      const p = getProduct(slug);
      if (!p?.dose) return null;
      const dose = p.dose[stage];
      const perWeek = dose * litresPerWeek;
      const packGrams = p.grams ?? 0;
      return {
        product: p,
        dose,
        perWeek,
        weeks: perWeek > 0 ? packGrams / perWeek : 0,
        litresPerLitres: litresPerWatering,
      };
    })
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .filter((r) => activeFeeds.includes(r.product.slug));
  }, [diameter, pots, waterings, stage, activeFeeds]);

  const inoculant = getProduct("mycorrhizal-inoculant");

  function applyRecipe(name: string) {
    const recipe = RECIPES.find((r) => r.name === name);
    if (!recipe) return;
    const next: Parts = { "coco-coir": 0, perlite: 0, vermiculite: 0, "worm-castings": 0, biochar: 0 };
    for (const [slug, v] of Object.entries(recipe.mix)) next[slug] = v;
    setParts(next);
    setRecipeName(name);
  }

  function nudge(slug: string, value: number) {
    setParts((prev) => ({ ...prev, [slug]: value }));
    setRecipeName(null);
  }

  const addMix = () => {
    const label = recipeName ?? "Custom mix";
    packs.forEach((row) => add(row.product.slug, row.qty, label));
  };

  const addFeed = () => {
    const label = "Feed schedule";
    feedPlan.forEach((row) => {
      if (row.perWeek <= 0) return;
      add(row.product.slug, 1, label);
    });
    if (inoculant) add(inoculant.slug, 1, label);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-8 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
        {/* ── Controls ─────────────────────────────────────────── */}
        <div>
          <div className="rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Step 1</p>
                <h2 className="display mt-1.5 text-[30px] leading-none">Build the medium</h2>
              </div>
              <button
                type="button"
                onClick={() => applyRecipe("Balanced Houseplant")}
                className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[var(--leaf)] hover:gap-3"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            {/* presets */}
            <div className="mt-6 flex flex-wrap gap-2">
              {RECIPES.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => applyRecipe(r.name)}
                  className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
                    recipeName === r.name
                      ? "border-[var(--moss)] bg-[var(--moss)] text-[var(--bone)]"
                      : "border-[rgba(28,58,41,.16)] text-[rgba(13,22,16,.65)] hover:border-[var(--moss)] hover:text-[var(--moss)]"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] italic text-[rgba(13,22,16,.45)]">
              {RECIPES.find((r) => r.name === recipeName)?.note ??
                "Your own blend — drag any slider to taste."}
            </p>

            {/* sliders */}
            <div className="mt-8 space-y-6">
              {BASES.map((slug) => {
                const p = getProduct(slug)!;
                const share = Math.round((pct[slug] ?? 0) * 100);
                return (
                  <div key={slug}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 rounded-full ring-2 ring-white"
                          style={{
                            background: `linear-gradient(140deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                          }}
                        />
                        <span className="text-[14px] font-semibold">{p.name}</span>
                      </div>
                      <span className="display text-[19px] tabular-nums">{share}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={parts[slug] ?? 0}
                      onChange={(e) => nudge(slug, Number(e.target.value))}
                      style={{ ["--pct" as string]: `${((parts[slug] ?? 0) / 60) * 100}%` }}
                      className="mix-range mt-1.5"
                      aria-label={`${p.name} share`}
                    />
                    <p className="text-[11.5px] leading-relaxed text-[rgba(13,22,16,.42)]">
                      {p.amendment?.grain} · typical {p.amendment?.rate}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* context */}
          <div className="mt-6 rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6 md:p-8">
            <p className="eyebrow text-[rgba(13,22,16,.4)]">Step 2</p>
            <h2 className="display mt-1.5 text-[26px] leading-none">Who is it for?</h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.6)]">Plant</span>
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[rgba(28,58,41,.16)] bg-[var(--bone)] px-3 text-[14px] outline-none focus:border-[var(--leaf)]"
                >
                  {PRODUCTS.filter((p) => p.category === "plants").map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                  <option value="none">No plant — just the mix</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.6)]">
                  Pot diameter · <span className="tabular-nums">{diameter} cm</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={1}
                  value={diameter}
                  onChange={(e) => setDiameter(Number(e.target.value))}
                  style={{ ["--pct" as string]: `${((diameter - 10) / 30) * 100}%` }}
                  className="mix-range mt-3"
                />
              </label>

              <label className="block">
                <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.6)]">
                  How many pots · <span className="tabular-nums">{pots}</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={pots}
                  onChange={(e) => setPots(Number(e.target.value))}
                  style={{ ["--pct" as string]: `${((pots - 1) / 11) * 100}%` }}
                  className="mix-range mt-3"
                />
              </label>

              <div className="rounded-xl bg-[rgba(51,104,76,.07)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--leaf)]">
                  Volume needed
                </p>
                <p className="display mt-1 text-[30px] leading-none tabular-nums">
                  {litres.toFixed(1)} L
                </p>
                <p className="mt-1.5 text-[11.5px] text-[rgba(13,22,16,.5)]">
                  {pots} × {diameter} cm · {(litres / pots).toFixed(1)} L each
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live read-out ────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[rgba(13,22,16,.4)]">The read-out</p>
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(215,232,107,.35)] px-3 py-1 text-[12px] font-bold text-[var(--moss)]">
                <Sparkles size={12} /> {match}% match
              </span>
            </div>

            {/* stacked column */}
            <div className="mt-6 flex gap-5">
              <div className="relative h-[210px] w-[86px] shrink-0 overflow-hidden rounded-[20px] border border-[rgba(13,22,16,.1)] bg-white">
                <div className="absolute inset-0 flex flex-col-reverse">
                  <AnimatePresence initial={false}>
                    {BASES.map((slug) => {
                      const p = getProduct(slug)!;
                      const h = (pct[slug] ?? 0) * 100;
                      if (h <= 0) return null;
                      return (
                        <motion.div
                          key={slug}
                          initial={reduce ? false : { height: 0 }}
                          animate={{ height: `${h}%` }}
                          exit={{ height: 0 }}
                          transition={{ type: "spring", stiffness: 130, damping: 20 }}
                          style={{
                            background: `linear-gradient(140deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                          }}
                          className="relative w-full overflow-hidden"
                        >
                          <span className="absolute inset-0 opacity-30 mix-blend-overlay">
                            <svg className="h-full w-full" aria-hidden>
                              <filter id={`grain-${slug}`}>
                                <feTurbulence baseFrequency="0.9" numOctaves="3" />
                                <feColorMatrix type="saturate" values="0" />
                              </filter>
                              <rect width="100%" height="100%" filter={`url(#grain-${slug})`} />
                            </svg>
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3.5">
                {[
                  { key: "drainage", icon: Droplets },
                  { key: "aeration", icon: Wind },
                  { key: "moisture", icon: Droplets },
                  { key: "nutrition", icon: Leaf },
                  { key: "biology", icon: FlaskConical },
                ].map(({ key, icon: Icon }) => {
                  const value = metrics[key as keyof typeof metrics] ?? 0;
                  const ideal = (IDEAL[plant] ?? DEFAULT_IDEAL)[key] ?? 0.6;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-1.5 font-semibold text-[rgba(13,22,16,.68)]">
                          <Icon size={12} className="text-[var(--leaf)]" />
                          {KEY_LABEL[key]}
                        </span>
                        <span className="tabular-nums text-[rgba(13,22,16,.45)]">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                      <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(28,58,41,.1)]">
                        <motion.div
                          className="h-full rounded-full bg-[var(--leaf)]"
                          animate={{ width: `${value * 100}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                        <span
                          className="absolute top-0 h-full w-[2px] bg-[var(--clay)]"
                          style={{ left: `${ideal * 100}%` }}
                          title="Ideal for this plant"
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t border-[rgba(28,58,41,.1)] pt-3 text-[12.5px]">
                  <span className="font-semibold text-[rgba(13,22,16,.68)]">Resulting pH</span>
                  <span className="display text-[17px] tabular-nums">{metrics.ph.toFixed(1)}</span>
                </div>
                <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[rgba(13,22,16,.42)]">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  The clay marker is the ideal level for the plant you picked. Close is better than
                  exact.
                </p>
              </div>
            </div>

            {/* packs */}
            <div className="mt-7 border-t border-[rgba(28,58,41,.1)] pt-6">
              <p className="eyebrow text-[rgba(13,22,16,.4)]">What to buy</p>
              <ul className="mt-4 space-y-2.5">
                {packs.map(({ product, share, needed, qty, cost }) => (
                  <li
                    key={product.slug}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          background: `linear-gradient(140deg, ${product.swatch[0]}, ${product.swatch[1]})`,
                        }}
                      />
                      <span className="truncate font-medium">{product.name}</span>
                      <span className="shrink-0 text-[11.5px] text-[rgba(13,22,16,.42)]">
                        {Math.round(share * 100)}% · {needed.toFixed(1)} L
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="font-bold tabular-nums">×{qty}</span>
                      <span className="ml-2 tabular-nums text-[rgba(13,22,16,.5)]">
                        {money(cost)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[11.5px] text-[rgba(13,22,16,.5)]">Mix subtotal</p>
                  <p className="display text-[32px] leading-none tabular-nums">{money(mixCost)}</p>
                  <p className="mt-1 text-[11.5px] text-[rgba(13,22,16,.42)]">
                    {mixCost >= DELIVERY.freeOver ? "Free delivery" : `${money(DELIVERY.freeOver - mixCost)} to free delivery`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMix}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--moss)] px-6 text-[14px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
                >
                  Add the mix
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feeding rhythm ───────────────────────────────────── */}
      <div className="mt-10 rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--moss-deep)] p-6 text-[var(--bone)] md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-[var(--lime)]">Step 3</p>
            <h2 className="display mt-2 text-[30px] leading-none text-white md:text-[38px]">
              Then feed it on a rhythm
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/60">
              A {diameter} cm pot drinks about {(potLitres(diameter) * 0.25).toFixed(1)} L of feed at
              each watering. These powders are dosed per litre, so the schedule below is what you
              actually need to buy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["seedling", "veg", "bloom"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-bold capitalize transition-colors ${
                  stage === s
                    ? "bg-[var(--lime)] text-[var(--moss-deep)]"
                    : "border border-white/20 text-white/70 hover:border-white/45 hover:text-white"
                }`}
              >
                {s === "veg" ? "Growing" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block max-w-xs">
            <span className="text-[12px] font-semibold uppercase tracking-[.14em] text-white/50">
              Feed {waterings}× per week
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={waterings}
              onChange={(e) => setWaterings(Number(e.target.value))}
              style={{ ["--pct" as string]: `${((waterings - 1) / 2) * 100}%` }}
              className="mix-range mt-2"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {FEEDS.map((slug) => {
              const p = getProduct(slug);
              if (!p) return null;
              const on = activeFeeds.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() =>
                    setActiveFeeds((prev) =>
                      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
                    )
                  }
                  className={`rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                    on
                      ? "border-[var(--lime)] bg-[var(--lime)]/15 text-[var(--lime)]"
                      : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {feedPlan.map((row) => (
            <motion.div
              key={row.product.slug}
              layout
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/12 bg-white/5 p-5 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display text-[17px] leading-tight text-white">{row.product.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--lime)]">
                    N{row.product.npk?.n} · P{row.product.npk?.p} · K{row.product.npk?.k}
                  </p>
                </div>
                <span className="text-right">
                  <span className="display block text-[24px] leading-none text-white tabular-nums">
                    {row.dose}
                  </span>
                  <span className="text-[10px] uppercase tracking-[.14em] text-white/45">g / L</span>
                </span>
              </div>
              <dl className="mt-5 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between">
                  <dt className="text-white/50">Per watering</dt>
                  <dd className="font-semibold tabular-nums">
                    {fmtGrams(row.dose * row.litresPerLitres)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Per week</dt>
                  <dd className="font-semibold tabular-nums">{fmtGrams(row.perWeek)}</dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1.5">
                  <dt className="text-white/50">One pack lasts</dt>
                  <dd className="font-bold text-[var(--lime)] tabular-nums">
                    {row.weeks > 52 ? "a year+" : `${Math.floor(row.weeks)} weeks`}
                  </dd>
                </div>
              </dl>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/12 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lime)]/15 text-[var(--lime)]">
              <FlaskConical size={15} />
            </span>
            <p className="max-w-xl text-[13px] leading-relaxed text-white/60">
              Add the inoculant once, at potting: dust {pots} g onto bare roots and it colonises in a
              fortnight.{" "}
              <Link href="/shop/product/mycorrhizal-inoculant" className="text-[var(--lime)] underline underline-offset-4">
                Mycorrhizal Inoculant
              </Link>{" "}
              is included with the feed schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={addFeed}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[var(--lime)] px-6 text-[14px] font-bold text-[var(--moss-deep)] transition-transform hover:scale-[1.02]"
          >
            Add the feed schedule
          </button>
        </div>
      </div>
    </div>
  );
}
