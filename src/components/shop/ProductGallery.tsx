"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { useRef, useState } from "react";
import type { Product } from "@/lib/shop/types";
import { ProductImage } from "./ProductImage";

const VIEWS = [
  { id: "full", label: "Full specimen", scale: 1, pos: "50% 50%" },
  { id: "detail", label: "Leaf & grain", scale: 2.1, pos: "32% 28%" },
  { id: "base", label: "Pot & base", scale: 1.75, pos: "50% 82%" },
];

export function ProductGallery({ product }: { product: Product }) {
  const [view, setView] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const frame = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const current = VIEWS[view];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!product.image) return;
    const el = frame.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="lg:sticky lg:top-24">
      <div
        ref={frame}
        onMouseMove={onMove}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[26px] border border-[rgba(28,58,41,.1)] bg-[var(--sand)]"
      >
        {product.image ? (
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: zooming ? 2.4 : current.scale,
              transformOrigin: zooming ? origin : current.pos,
            }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 120, damping: 22, mass: 0.5 }
            }
          >
            <ProductImage product={product} sizes="(max-width: 1024px) 95vw, 620px" priority />
          </motion.div>
        ) : (
          <ProductImage product={product} sizes="(max-width: 1024px) 95vw, 620px" priority />
        )}

        {product.image ? (
          <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-[var(--paper)]/85 px-3 py-1.5 text-[11px] font-semibold text-[var(--moss)] backdrop-blur">
            <Maximize2 size={11} /> Hover to zoom
          </span>
        ) : null}

        {product.compareAt ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--clay)] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[.12em] text-white">
            Save {Math.round((1 - product.price / product.compareAt) * 100)}%
          </span>
        ) : null}
      </div>

      {/* view switcher */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(i)}
            className={`relative aspect-[4/3] overflow-hidden rounded-xl border transition-all ${
              view === i
                ? "border-[var(--moss)] ring-2 ring-[var(--moss)]/15"
                : "border-[rgba(28,58,41,.12)] hover:border-[rgba(28,58,41,.35)]"
            }`}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${v.scale * 1.15})`,
                transformOrigin: v.pos,
              }}
            >
              <ProductImage product={product} sizes="160px" swatchLabel={false} />
            </div>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(9,20,14,.8)] to-transparent px-2 pb-1.5 pt-6 text-left text-[9.5px] font-bold uppercase tracking-[.1em] text-white/90">
              {v.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {product.stock <= 6 ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-[12.5px] font-semibold text-[var(--clay)]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--clay)]" />
            {product.stock} left from this batch — the next one is four weeks out
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
