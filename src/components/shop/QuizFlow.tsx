"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getProduct } from "@/lib/shop/catalogue";
import { money } from "@/lib/shop/format";
import { QUESTIONS, score, type QuizAnswer } from "@/lib/shop/quiz";
import { AddToCart } from "./AddToCart";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";

const PLANT_RECIPE: Record<string, string> = {
  "monstera-albo": "Aroid Mix",
  "philodendron-pink-princess": "Aroid Mix",
  "fiddle-leaf-fig": "Ficus & Strelitzia",
  "strelitzia-nicolai": "Ficus & Strelitzia",
  "zz-raven": "Dry-Rhythm Mix",
};

const KIT_MIX: Record<string, string[]> = {
  "Aroid Mix": ["coco-coir", "perlite", "worm-castings", "biochar"],
  "Ficus & Strelitzia": ["coco-coir", "worm-castings", "vermiculite", "perlite"],
  "Dry-Rhythm Mix": ["coco-coir", "perlite", "biochar"],
};

const BACKDROP = ["#1c3a29", "#243f2c", "#2f4a33", "#3a5138"];

export function QuizFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  const question = QUESTIONS[step];
  const results = useMemo(() => score(answers), [answers]);

  const choose = (id: string, value: number) => {
    const next = { ...answers, [question.id]: { id, value } };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 260);
    } else {
      setTimeout(() => setDone(true), 260);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  const top = results[0];
  const topProduct = top ? getProduct(top.slug) : undefined;
  const kit = topProduct
    ? [
        topProduct.slug,
        ...(KIT_MIX[PLANT_RECIPE[topProduct.slug] ?? "Aroid Mix"] ?? []),
        "grow-20-10-20",
        "cal-mag",
        "mycorrhizal-inoculant",
      ]
    : [];

  const kitTotal = kit.reduce((sum, slug) => {
    const p = getProduct(slug);
    return sum + (p?.price ?? 0);
  }, 0);

  if (done && topProduct) {
    return (
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1400px] px-5 py-12 md:px-8"
      >
        <div className="overflow-hidden rounded-[30px] bg-[var(--moss-deep)] text-[var(--bone)]">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-[320px]">
              {topProduct.image ? (
                <Image
                  src={topProduct.image}
                  alt={topProduct.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0">
                  <ProductImage product={topProduct} sizes="520px" swatchLabel={false} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--moss-deep)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[var(--moss-deep)]" />
            </div>

            <div className="p-7 md:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--lime)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--moss-deep)]">
                <Sparkles size={12} /> {top.match}% match
              </span>
              <h2 className="display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] text-white">
                {topProduct.name}
              </h2>
              <p className="mt-3 text-[15px] text-white/60">{topProduct.tagline}</p>

              <ul className="mt-7 space-y-2.5">
                {top.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[14px] text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lime)]" />
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-white/12 bg-white/5 p-5">
                <p className="eyebrow text-[var(--lime)]">The whole kit · {money(kitTotal)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {kit.map((slug) => {
                    const p = getProduct(slug);
                    if (!p) return null;
                    return (
                      <span
                        key={slug}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/75"
                      >
                        {p.name}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">
                  The plant, the {PLANT_RECIPE[topProduct.slug] ?? "Aroid Mix"} to put it in, a
                  growth feed, a calcium-magnesium top-up for our soft water, and an inoculant for
                  the roots.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <KitAdder kit={kit} />
                </div>
              </div>

              <button
                type="button"
                onClick={restart}
                className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold text-white/50 hover:text-white"
              >
                <RotateCcw size={13} /> Start again
              </button>
            </div>
          </div>
        </div>

        {/* runners up */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {results.slice(1, 3).map((r, i) => {
            const p = getProduct(r.slug);
            if (!p) return null;
            return (
              <motion.div
                key={r.slug}
                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
                className="flex gap-5 rounded-[24px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-5"
              >
                <Link
                  href={`/shop/product/${p.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl"
                >
                  <ProductImage product={p} sizes="96px" swatchLabel={false} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/shop/product/${p.slug}`}>
                      <p className="display text-[19px] leading-tight hover:text-[var(--leaf)]">
                        {p.name}
                      </p>
                    </Link>
                    <span className="shrink-0 rounded-full bg-[rgba(51,104,76,.1)] px-2.5 py-1 text-[11px] font-bold text-[var(--leaf)]">
                      {r.match}%
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[rgba(13,22,16,.55)]">
                    {r.reasons[0] ?? p.tagline}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="display text-[16px]">{money(p.price)}</span>
                    <AddToCart slug={p.slug} variant="pill" label="Add" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="relative min-h-[calc(100svh-74px)] transition-colors duration-1000"
      style={{ background: BACKDROP[step] ?? BACKDROP[0] }}
    >
      <div className="mx-auto max-w-[1100px] px-5 pb-16 pt-28 md:px-8 md:pb-20 md:pt-36">
        {/* progress */}
        <div className="flex items-center gap-4">
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[var(--lime)]"
              animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[.18em] text-white/45">
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={reduce ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -30 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12"
          >
            <p className="eyebrow text-[var(--lime)]">{question.step}</p>
            <h1 className="display mt-4 max-w-[18ch] text-[clamp(2.1rem,5.6vw,3.8rem)] text-white">
              {question.title}
            </h1>
            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-white/55">
              {question.help}
            </p>

            <div
              className={`mt-10 grid gap-3 ${
                question.options.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
            >
              {question.options.map((opt, i) => {
                const selected = answers[question.id]?.id === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt.id, opt.value)}
                    initial={reduce ? undefined : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.07, duration: 0.5 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group flex flex-col items-start justify-between gap-8 rounded-3xl border p-6 text-left transition-all ${
                      selected
                        ? "border-[var(--lime)] bg-[var(--lime)] text-[var(--moss-deep)]"
                        : "border-white/15 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                    }`}
                  >
                    <span className="display text-[26px] leading-tight">{opt.label}</span>
                    <span
                      className={`text-[13px] leading-relaxed ${
                        selected ? "text-[rgba(20,42,30,.7)]" : "text-white/50"
                      }`}
                    >
                      {opt.detail}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-white/45 transition-colors hover:text-white disabled:opacity-25"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < QUESTIONS.length - 1 && answers[question.id] ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="ml-auto inline-flex items-center gap-2 text-[13px] font-bold text-[var(--lime)]"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KitAdder({ kit }: { kit: string[] }) {
  const [state, setState] = useState<"idle" | "done">("idle");
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        kit.forEach((slug) => add(slug, 1, "Finder kit"));
        setState("done");
        setTimeout(() => setState("idle"), 2000);
      }}
      className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--lime)] px-6 text-[14px] font-bold text-[var(--moss-deep)] transition-transform hover:scale-[1.02]"
    >
      {state === "done" ? "Whole kit added ✓" : "Add the whole kit"}
    </button>
  );
}
