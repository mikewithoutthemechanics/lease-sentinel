"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCart({
  slug,
  qty = 1,
  recipe,
  variant = "solid",
  label = "Add to bag",
  className = "",
  size,
  unitPrice,
}: {
  slug: string;
  qty?: number;
  recipe?: string;
  variant?: "solid" | "ghost" | "pill" | "block";
  label?: string;
  className?: string;
  /** Chosen size/pot option label. */
  size?: string;
  /** Price for the chosen size, when it differs from the catalogue price. */
  unitPrice?: number;
}) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);

  const base =
    "relative inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50";
  const styles = {
    solid:
      "h-11 rounded-full bg-[var(--moss)] px-6 text-sm text-[var(--bone)] hover:bg-[var(--leaf)]",
    ghost:
      "h-11 rounded-full border border-[rgba(28,58,41,.28)] px-6 text-sm text-[var(--moss)] hover:border-[var(--moss)] hover:bg-[rgba(28,58,41,.06)]",
    pill: "h-10 rounded-full bg-[var(--paper)]/95 px-4 text-[13px] text-[var(--moss)] shadow-[0_6px_20px_-6px_rgba(13,22,16,.4)] backdrop-blur hover:bg-white",
    block:
      "h-14 w-full rounded-2xl bg-[var(--moss)] px-6 text-[15px] text-[var(--bone)] hover:bg-[var(--leaf)]",
  }[variant];

  return (
    <button
      type="button"
      className={`${base} ${styles} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add(slug, qty, recipe, size, unitPrice);
        setDone(true);
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="inline-flex items-center gap-2"
          >
            <Check size={16} strokeWidth={2.6} /> Added
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="inline-flex items-center gap-2"
          >
            {variant === "pill" ? <Plus size={15} strokeWidth={2.6} /> : <ShoppingBag size={15} />}
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
