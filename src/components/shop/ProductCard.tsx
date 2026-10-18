"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { money } from "@/lib/shop/format";
import type { Product } from "@/lib/shop/types";
import { AddToCart } from "./AddToCart";
import { ProductImage } from "./ProductImage";

export function ProductCard({
  product,
  index = 0,
  priority = false,
  compact = false,
}: {
  product: Product;
  index?: number;
  priority?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <motion.article
      initial={reduce ? undefined : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        className="relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] shadow-[0_1px_0_rgba(13,22,16,.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[rgba(28,58,41,.24)] hover:shadow-[0_30px_60px_-30px_rgba(13,22,16,.35)]"
      >
        <Link href={`/shop/product/${product.slug}`} className="relative block">
          <div className={`relative w-full overflow-hidden ${compact ? "aspect-square" : "aspect-[4/5]"}`}>
            <motion.div
              className="absolute inset-0"
              whileHover={reduce ? undefined : { scale: 1.06 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductImage product={product} priority={priority} />
            </motion.div>
            <span className="spot" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(13,22,16,.28)] via-transparent to-transparent opacity-70" />
          </div>

          {product.badges?.length ? (
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {product.badges.slice(0, 2).map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-[var(--paper)]/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--moss)] backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          {product.compareAt ? (
            <span className="absolute right-4 top-4 rounded-full bg-[var(--clay)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white">
              Save {Math.round((1 - product.price / product.compareAt) * 100)}%
            </span>
          ) : null}
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/shop/product/${product.slug}`}>
                <h3 className="display truncate text-[19px] leading-tight text-[var(--ink)] group-hover:text-[var(--leaf)] transition-colors">
                  {product.name}
                </h3>
              </Link>
              {product.latin ? (
                <p className="mt-1 truncate text-[11.5px] italic text-[rgba(13,22,16,.5)]">
                  {product.latin}
                </p>
              ) : (
                <p className="mt-1 text-[11.5px] font-medium uppercase tracking-[.14em] text-[rgba(13,22,16,.42)]">
                  {product.size}
                </p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[rgba(13,22,16,.62)]">
              <Star size={11} className="fill-[var(--clay)] text-[var(--clay)]" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.62)]">
            {product.tagline}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {product.npk ? (
              <span className="rounded-md bg-[rgba(51,104,76,.09)] px-2 py-1 font-mono text-[10.5px] font-semibold tracking-tight text-[var(--leaf)]">
                N{product.npk.n} · P{product.npk.p} · K{product.npk.k}
              </span>
            ) : null}
            {product.care ? (
              <span className="rounded-md bg-[rgba(201,111,74,.1)] px-2 py-1 text-[10.5px] font-semibold text-[var(--clay)]">
                {["Shade-loving", "Low", "Medium", "Bright", "Full sun"][product.care.light - 1]} light
              </span>
            ) : null}
            {product.amendment ? (
              <span className="rounded-md bg-[rgba(168,129,90,.12)] px-2 py-1 text-[10.5px] font-semibold text-[#8a6538]">
                {product.amendment.rate}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <p className="display text-[22px] leading-none text-[var(--ink)]">
                {money(product.price)}
              </p>
              {product.compareAt ? (
                <p className="mt-1 text-[11px] text-[rgba(13,22,16,.4)] line-through">
                  {money(product.compareAt)}
                </p>
              ) : null}
            </div>
            <AddToCart slug={product.slug} variant="pill" label="Add" className="shrink-0" />
          </div>
        </div>

        {product.stock <= 5 ? (
          <p className="px-5 pb-4 text-[11px] font-semibold text-[var(--clay)]">
            Only {product.stock} left in this batch
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}
