"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { getProduct } from "@/lib/shop/catalogue";
import { DELIVERY, money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";

function suggestionsFor(slugs: string[]): string[] {
  const out: string[] = [];
  for (const slug of slugs) {
    for (const p of getProduct(slug)?.pairings ?? []) {
      if (!slugs.includes(p) && !out.includes(p)) out.push(p);
    }
  }
  return out.slice(0, 3);
}

export function CartDrawer() {
  const { isOpen, closeCart, lines, count, subtotal, delivery, total, setQty, remove, add, freeDeliveryGap } =
    useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  const progress = Math.min(100, (subtotal / DELIVERY.freeOver) * 100);
  const suggestions = suggestionsFor(lines.map((l) => l.slug));

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close bag"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-[rgba(13,22,16,.44)] backdrop-blur-[3px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-[var(--bone)] shadow-[-30px_0_80px_-30px_rgba(13,22,16,.5)]"
          >
            <div className="flex items-center justify-between border-b border-[rgba(28,58,41,.1)] px-6 py-5">
              <div>
                <p className="eyebrow text-[rgba(13,22,16,.45)]">Your bag</p>
                <p className="display mt-1 text-[26px] leading-none">
                  {count} {count === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="text-[13px] font-semibold text-[rgba(13,22,16,.55)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
              >
                Close
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(51,104,76,.1)] text-[var(--leaf)]">
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M12 21c0-6 3-10 8-11-1 6-4 9-8 11Z" />
                    <path d="M12 21c0-5-2.5-8.5-7-9.5.8 5 3.5 8 7 9.5Z" />
                    <path d="M12 21v-6" />
                  </svg>
                </div>
                <div>
                  <p className="display text-[22px]">Nothing potted yet.</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.55)]">
                    Start with a plant, then let the Mix Lab build the soil and feed around it.
                  </p>
                </div>
                <Link
                  href="/shop/plants"
                  onClick={closeCart}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--moss)] px-6 text-[14px] font-semibold text-[var(--bone)] hover:bg-[var(--leaf)]"
                >
                  Browse living things <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {/* free delivery meter */}
                  <div className="mb-5 rounded-2xl border border-[rgba(28,58,41,.1)] bg-[var(--paper)] p-4">
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
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>

                  <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                      {lines.map((line) => (
                        <motion.li
                          key={`${line.slug}-${line.recipe ?? ""}-${line.variant ?? ""}`}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          className="flex gap-4"
                        >
                          <Link
                            href={`/shop/product/${line.slug}`}
                            onClick={closeCart}
                            className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[rgba(28,58,41,.1)] bg-[var(--sand)]"
                          >
                            <ProductImage product={line.product} sizes="80px" swatchLabel={false} />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  href={`/shop/product/${line.slug}`}
                                  onClick={closeCart}
                                  className="display block truncate text-[16px] leading-tight hover:text-[var(--leaf)]"
                                >
                                  {line.product.name}
                                </Link>
                                <p className="mt-0.5 text-[11.5px] text-[rgba(13,22,16,.5)]">
                                  {line.variant ?? line.product.size}
                                </p>
                                {line.recipe ? (
                                  <span className="mt-1.5 inline-block rounded-md bg-[rgba(51,104,76,.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--leaf)]">
                                    {line.recipe}
                                  </span>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(line.slug, line.recipe, line.variant)}
                                className="shrink-0 p-1 text-[rgba(13,22,16,.32)] transition-colors hover:text-[var(--clay)]"
                                aria-label={`Remove ${line.product.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-full border border-[rgba(28,58,41,.16)] bg-[var(--paper)]">
                                <button
                                  type="button"
                                  onClick={() => setQty(line.slug, line.qty - 1, line.recipe, line.variant)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--moss)] hover:bg-[rgba(28,58,41,.06)]"
                                  aria-label="Decrease"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-5 text-center text-[13px] font-bold tabular-nums">
                                  {line.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQty(line.slug, line.qty + 1, line.recipe, line.variant)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--moss)] hover:bg-[rgba(28,58,41,.06)]"
                                  aria-label="Increase"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <p className="display text-[17px] tabular-nums">
                                {money(line.lineTotal)}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  {suggestions.length ? (
                    <div className="mt-8">
                      <p className="eyebrow text-[rgba(13,22,16,.4)]">Goes with what you have</p>
                      <div className="mt-3 space-y-2">
                        {suggestions.map((slug) => {
                          const p = getProduct(slug);
                          if (!p) return null;
                          return (
                            <div
                              key={slug}
                              className="flex items-center gap-3 rounded-xl border border-[rgba(28,58,41,.1)] bg-[var(--paper)] p-2.5"
                            >
                              <Link
                                href={`/shop/product/${slug}`}
                                onClick={closeCart}
                                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                              >
                                <ProductImage product={p} sizes="48px" swatchLabel={false} />
                              </Link>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">{p.name}</p>
                                <p className="text-[11.5px] text-[rgba(13,22,16,.5)]">
                                  {money(p.price)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => add(slug)}
                                className="flex h-8 items-center gap-1 rounded-full bg-[var(--moss)] px-3 text-[11.5px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
                              >
                                <Plus size={12} strokeWidth={3} /> Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[rgba(28,58,41,.1)] bg-[var(--paper)] px-6 py-5">
                  <dl className="space-y-2 text-[13.5px]">
                    <div className="flex justify-between">
                      <dt className="text-[rgba(13,22,16,.6)]">Subtotal</dt>
                      <dd className="font-semibold tabular-nums">{money(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[rgba(13,22,16,.6)]">
                        Delivery
                        {lines.some((l) => l.product.category === "plants") ? (
                          <span className="ml-1 text-[11px] text-[var(--clay)]">(plant lane)</span>
                        ) : null}
                      </dt>
                      <dd className="font-semibold tabular-nums">
                        {delivery === 0 ? "Free" : money(delivery)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[rgba(28,58,41,.1)] pt-3">
                      <dt className="display text-[19px]">Total</dt>
                      <dd className="display text-[24px] tabular-nums">{money(total)}</dd>
                    </div>
                  </dl>
                  <Link
                    href="/shop/checkout"
                    onClick={closeCart}
                    className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--moss)] text-[15px] font-semibold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
                  >
                    Checkout <ArrowRight size={17} />
                  </Link>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="mt-3 w-full text-center text-[12.5px] font-semibold text-[rgba(13,22,16,.5)] hover:text-[var(--ink)]"
                  >
                    Keep browsing
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
