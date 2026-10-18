"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { allTags, applyFilters, type Sort } from "@/lib/shop/filters";
import type { Product } from "@/lib/shop/types";
import { ProductCard } from "./ProductCard";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Most loved" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "rating", label: "Best rated" },
];

export function CollectionGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const tags = useMemo(() => allTags(products), [products]);
  const list = useMemo(() => applyFilters(products, active, sort), [products, active, sort]);

  const toggle = (tag: string) =>
    setActive((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <div>
      {/* toolbar */}
      <div className="sticky top-16 z-30 -mx-5 mb-8 border-b border-[rgba(28,58,41,.1)] bg-[rgba(246,243,234,.9)] px-5 py-3 backdrop-blur-xl md:-mx-8 md:top-[74px] md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 items-center gap-2 rounded-full border border-[rgba(28,58,41,.18)] bg-[var(--paper)] px-4 text-[12.5px] font-bold text-[var(--moss)] md:hidden"
          >
            <SlidersHorizontal size={13} /> Filter
            {active.length ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--moss)] text-[10px] text-[var(--bone)]">
                {active.length}
              </span>
            ) : null}
          </button>

          <div className="no-scrollbar hidden flex-1 items-center gap-2 overflow-x-auto md:flex">
            {tags.map((tag) => {
              const on = active.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                    on
                      ? "border-[var(--moss)] bg-[var(--moss)] text-[var(--bone)]"
                      : "border-[rgba(28,58,41,.16)] bg-[var(--paper)] text-[rgba(13,22,16,.62)] hover:border-[var(--moss)] hover:text-[var(--moss)]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {active.length ? (
              <button
                type="button"
                onClick={() => setActive([])}
                className="ml-1 flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-[var(--clay)]"
              >
                <X size={12} /> Clear
              </button>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden text-[11.5px] text-[rgba(13,22,16,.45)] sm:inline">
              {list.length} of {products.length}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 rounded-full border border-[rgba(28,58,41,.16)] bg-[var(--paper)] px-3 text-[12.5px] font-semibold text-[var(--moss)] outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-wrap gap-2 pt-3">
                {tags.map((tag) => {
                  const on = active.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${
                        on
                          ? "border-[var(--moss)] bg-[var(--moss)] text-[var(--bone)]"
                          : "border-[rgba(28,58,41,.16)] bg-[var(--paper)] text-[rgba(13,22,16,.62)]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* grid */}
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.slug}
              layout={!reduce}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.25) }}
            >
              <ProductCard product={p} index={0} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[rgba(28,58,41,.2)] py-24 text-center">
          <p className="display text-[24px]">Nothing matches all of that.</p>
          <p className="mt-2 text-[13.5px] text-[rgba(13,22,16,.55)]">
            Try removing a filter — or build exactly what you need in the Mix Lab.
          </p>
          <button
            type="button"
            onClick={() => setActive([])}
            className="mt-6 rounded-full bg-[var(--moss)] px-6 py-3 text-[13px] font-bold text-[var(--bone)]"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
