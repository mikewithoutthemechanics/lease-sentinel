"use client";

import { motion } from "framer-motion";
import { Minus, Plus, ShieldCheck, Sprout, Truck } from "lucide-react";
import { useState } from "react";
import { DELIVERY, money } from "@/lib/shop/format";
import type { Product } from "@/lib/shop/types";
import { variantsFor } from "@/lib/shop/variants";
import { useCart } from "./CartProvider";

export function ProductPurchase({ product }: { product: Product }) {
  const variants = variantsFor(product);
  const [index, setIndex] = useState(1);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const variant = variants[index] ?? variants[0];
  const { add } = useCart();

  return (
    <div>
      {/* price */}
      <div className="flex items-end gap-3">
        <span className="display text-[38px] leading-none tabular-nums">{money(variant.price)}</span>
        {product.compareAt && index === 1 ? (
          <span className="pb-1 text-[15px] text-[rgba(13,22,16,.4)] line-through">
            {money(product.compareAt)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[12.5px] text-[rgba(13,22,16,.5)]">
        Incl. VAT · {product.size}
        {product.category === "plants" ? " · ships in a sealed plant box" : " · ships within 24 h"}
      </p>

      {/* variants */}
      <div className="mt-7">
        <p className="eyebrow text-[rgba(13,22,16,.4)]">
          {product.category === "plants" ? "Pot" : "Size"}
        </p>
        <div className="mt-3 grid gap-2">
          {variants.map((v, i) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setIndex(i)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                index === i
                  ? "border-[var(--moss)] bg-[rgba(51,104,76,.06)]"
                  : "border-[rgba(28,58,41,.14)] hover:border-[rgba(28,58,41,.32)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    index === i ? "border-[var(--moss)]" : "border-[rgba(28,58,41,.3)]"
                  }`}
                >
                  {index === i ? (
                    <motion.span
                      layoutId={`dot-${product.slug}`}
                      className="h-2 w-2 rounded-full bg-[var(--moss)]"
                    />
                  ) : null}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold">{v.label}</span>
                  <span className="block text-[11.5px] text-[rgba(13,22,16,.45)]">{v.note}</span>
                </span>
              </span>
              <span className="display text-[17px] tabular-nums">{money(v.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* add to bag */}
      <div className="mt-6 flex items-stretch gap-3">
        <div className="flex h-14 items-center gap-1 rounded-2xl border border-[rgba(28,58,41,.16)] bg-[var(--paper)] px-1.5">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--moss)] hover:bg-[rgba(28,58,41,.06)]"
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span className="w-7 text-center text-[15px] font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--moss)] hover:bg-[rgba(28,58,41,.06)]"
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            add(product.slug, qty, undefined, variant.label, variant.price);
            setAdding(true);
            setTimeout(() => setAdding(false), 1500);
          }}
          className="relative flex h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--moss)] text-[15px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
        >
          {adding ? "Added to bag ✓" : `Add to bag · ${money(variant.price * qty)}`}
        </button>
      </div>

      <ul className="mt-6 space-y-2.5 text-[12.5px] text-[rgba(13,22,16,.6)]">
        {variant.price * qty >= DELIVERY.freeOver ? (
          <li className="flex items-center gap-2.5 font-semibold text-[var(--leaf)]">
            <Truck size={14} /> Free delivery unlocked
          </li>
        ) : (
          <li className="flex items-center gap-2.5">
            <Truck size={14} className="text-[var(--leaf)]" /> {money(DELIVERY.freeOver - variant.price * qty)} more for free delivery
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <ShieldCheck size={14} className="text-[var(--leaf)]" /> 14-day arrival promise — if it
          lands badly, we replace it
        </li>
        {product.category === "plants" ? (
          <li className="flex items-center gap-2.5">
            <Sprout size={14} className="text-[var(--leaf)]" /> Acclimatised in KZN before dispatch
          </li>
        ) : (
          <li className="flex items-center gap-2.5">
            <Sprout size={14} className="text-[var(--leaf)]" /> Packed in a compostable mailer
          </li>
        )}
      </ul>
    </div>
  );
}
