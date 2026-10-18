"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getProduct } from "@/lib/shop/catalogue";
import { DELIVERY, money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";

export function CartView() {
  const { lines, subtotal, delivery, total, count, setQty, remove, add, freeDeliveryGap, hydrated } =
    useCart();

  const suggestions = (() => {
    const slugs = lines.map((l) => l.slug);
    const out: string[] = [];
    for (const slug of slugs) {
      for (const p of getProduct(slug)?.pairings ?? []) {
        if (!slugs.includes(p) && !out.includes(p)) out.push(p);
      }
    }
    return out.slice(0, 3).map((s) => getProduct(s)!).filter(Boolean);
  })();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-40 md:px-8">
        <div className="h-8 w-56 animate-pulse rounded-full bg-[rgba(28,58,41,.08)]" />
        <div className="mt-8 h-40 animate-pulse rounded-[28px] bg-[rgba(28,58,41,.06)]" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-28 md:px-8">
        <p className="eyebrow text-[rgba(13,22,16,.4)]">Your bag</p>
        <h1 className="display mt-4 max-w-[16ch] text-[clamp(2.4rem,6vw,4.2rem)]">
          Nothing potted yet.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[rgba(13,22,16,.6)]">
          Start with a plant and let the Mix Lab build the soil and the feeding rhythm around it —
          or just wander through the three rooms.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/shop/plants"
            className="inline-flex h-13 items-center gap-2 rounded-full bg-[var(--moss)] px-7 py-4 text-[14.5px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
          >
            Living things <ArrowRight size={16} />
          </Link>
          <Link
            href="/shop/mix"
            className="inline-flex h-13 items-center gap-2 rounded-full border border-[rgba(28,58,41,.24)] px-7 py-4 text-[14.5px] font-bold text-[var(--moss)] hover:bg-[rgba(28,58,41,.05)]"
          >
            Open the Mix Lab
          </Link>
        </div>

        <div className="mt-20">
          <p className="eyebrow text-[rgba(13,22,16,.4)]">Most loved right now</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {["monstera-albo", "grow-20-10-20", "perlite"].map((slug, i) => {
              const p = getProduct(slug);
              if (!p) return null;
              return <ProductCard key={slug} product={p} index={i} />;
            })}
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, (subtotal / DELIVERY.freeOver) * 100);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 md:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-[rgba(13,22,16,.4)]">Your bag</p>
          <h1 className="display mt-3 text-[clamp(2.2rem,5.4vw,3.6rem)]">
            {count} {count === 1 ? "item" : "items"}
          </h1>
        </div>
        <Link
          href="/shop/collections"
          className="text-[13.5px] font-bold text-[var(--leaf)] underline-offset-4 hover:underline"
        >
          Keep browsing
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:gap-14">
        <div>
          <div className="rounded-2xl border border-[rgba(28,58,41,.1)] bg-[var(--paper)] p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12.5px] font-semibold text-[var(--moss)]">
                {freeDeliveryGap > 0
                  ? `${money(freeDeliveryGap)} to free delivery`
                  : "Free delivery unlocked"}
              </p>
              <p className="text-[11px] text-[rgba(13,22,16,.45)]">{money(DELIVERY.freeOver)}</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(28,58,41,.1)]">
              <motion.div
                className="h-full rounded-full bg-[var(--leaf)]"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <ul className="mt-6 divide-y divide-[rgba(28,58,41,.1)]">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.li
                  key={`${line.slug}-${line.recipe ?? ""}-${line.variant ?? ""}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-5 py-6"
                >
                  <Link
                    href={`/shop/product/${line.slug}`}
                    className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl border border-[rgba(28,58,41,.1)]"
                  >
                    <ProductImage product={line.product} sizes="112px" swatchLabel={false} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/shop/product/${line.slug}`}
                          className="display text-[21px] leading-tight hover:text-[var(--leaf)]"
                        >
                          {line.product.name}
                        </Link>
                        <p className="mt-1 text-[12px] text-[rgba(13,22,16,.5)]">
                          {line.variant ?? line.product.size}
                        </p>
                        {line.recipe ? (
                          <span className="mt-2 inline-block rounded-md bg-[rgba(51,104,76,.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--leaf)]">
                            {line.recipe}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.slug, line.recipe, line.variant)}
                        className="shrink-0 p-1.5 text-[rgba(13,22,16,.3)] transition-colors hover:text-[var(--clay)]"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-[rgba(28,58,41,.16)] bg-[var(--paper)]">
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty - 1, line.recipe, line.variant)}
                          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(28,58,41,.06)]"
                          aria-label="Decrease"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-[14px] font-bold tabular-nums">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty + 1, line.recipe, line.variant)}
                          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(28,58,41,.06)]"
                          aria-label="Increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="display text-[22px] tabular-nums">{money(line.lineTotal)}</p>
                        {line.qty > 1 ? (
                          <p className="text-[11.5px] text-[rgba(13,22,16,.45)]">
                            {money(line.unit)} each
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
            <p className="eyebrow text-[rgba(13,22,16,.4)]">Summary</p>
            <dl className="mt-5 space-y-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-[rgba(13,22,16,.6)]">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgba(13,22,16,.6)]">Delivery</dt>
                <dd className="font-semibold tabular-nums">
                  {delivery === 0 ? "Free" : money(delivery)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-[rgba(28,58,41,.1)] pt-3">
                <dt className="display text-[19px]">Total</dt>
                <dd className="display text-[26px] tabular-nums">{money(total)}</dd>
              </div>
            </dl>

            <Link
              href="/shop/checkout"
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--moss)] text-[15px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
            >
              Checkout <ArrowRight size={17} />
            </Link>

            <ul className="mt-5 space-y-2 text-[11.5px] leading-relaxed text-[rgba(13,22,16,.5)]">
              <li>Plants travel Monday–Wednesday in a dedicated plant lane.</li>
              <li>Free delivery over {money(DELIVERY.freeOver)} · {DELIVERY.leadTime}.</li>
              <li>Secure checkout via Payfast or card.</li>
            </ul>
          </div>

          {suggestions.length ? (
            <div className="mt-6 rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
              <p className="eyebrow text-[rgba(13,22,16,.4)]">Complete the ritual</p>
              <ul className="mt-4 space-y-3">
                {suggestions.map((p) => (
                  <li key={p.slug} className="flex items-center gap-3">
                    <Link
                      href={`/shop/product/${p.slug}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                    >
                      <ProductImage product={p} sizes="56px" swatchLabel={false} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{p.name}</p>
                      <p className="text-[12px] text-[rgba(13,22,16,.5)]">{money(p.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => add(p.slug)}
                      className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-[var(--moss)] px-3 text-[11.5px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
                    >
                      <Plus size={12} strokeWidth={3} /> Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
