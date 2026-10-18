"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Mail, Package, Sprout, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { money } from "@/lib/shop/format";
import { ProductImage } from "./ProductImage";
import { getProduct } from "@/lib/shop/catalogue";

type StoredOrder = {
  ref: string;
  placedAt: string;
  items: { slug: string; name: string; variant?: string; recipe?: string; qty: number; price: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  contact: { name: string; email: string; phone: string };
  ship: { address: string; suburb: string; city: string; province: string; postal: string };
  speed: string;
};

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function GrowingPlant() {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 140"
      className="h-36 w-36 text-[var(--lime)]"
      initial="hidden"
      animate="visible"
      aria-hidden
    >
      <motion.path
        d="M60 138V62"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1 },
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      {[
        { d: "M60 62C60 62 44 52 34 34c14 0 26 12 26 28Z", delay: 0.5, side: -1 },
        { d: "M60 74C60 74 78 64 92 46c-16 2-28 14-32 28Z", delay: 0.8, side: 1 },
        { d: "M60 50C60 50 48 40 42 24c12 2 18 12 18 26Z", delay: 1.1, side: -1 },
      ].map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill="currentColor"
          initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ originX: "60px", originY: `${62 + i * 12}px` }}
          transition={{ delay: leaf.delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          opacity={0.92}
        />
      ))}
    </motion.svg>
  );
}

export function OrderConfirmation({ reference }: { reference: string }) {
  // localStorage is only readable after hydration; derive it during render instead
  // of pushing it into state from an effect.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );

  const { order, loaded } = useMemo(() => {
    if (!hydrated) return { order: null as StoredOrder | null, loaded: false };
    try {
      const raw = window.localStorage.getItem("hlaza.lastOrder.v1");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredOrder;
        if (parsed.ref === reference) return { order: parsed, loaded: true };
      }
    } catch {
      /* ignore */
    }
    return { order: null as StoredOrder | null, loaded: true };
  }, [hydrated, reference]);

  const placed = order ? new Date(order.placedAt) : new Date();
  const eta = new Date(placed);
  eta.setDate(eta.getDate() + (order?.speed === "express" ? 1 : 4));

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[560px] bg-[var(--moss-deep)]" />
      <div
        className="absolute -left-32 top-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #d7e86b, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-[1000px] px-5 pb-20 pt-28 text-center md:px-8 md:pt-36">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="mx-auto flex w-fit items-center justify-center"
        >
          <GrowingPlant />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="eyebrow text-[var(--lime)]"
        >
          Order {reference}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="display mx-auto mt-4 max-w-[16ch] text-[clamp(2.2rem,6vw,4rem)] text-white"
        >
          {order ? `Thank you, ${order.contact.name.split(" ")[0]}.` : "Thank you."}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/65"
        >
          {order
            ? `A confirmation is on its way to ${order.contact.email}. We pack plants on the morning they ship, never the night before.`
            : "Your order is confirmed. A confirmation email is on its way."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          className="mx-auto mt-12 grid gap-4 text-left sm:grid-cols-3"
        >
          {[
            { icon: Package, label: "Packed", when: "Within 24 hours" },
            { icon: Truck, label: "On the way", when: `${DELIVERY_LABEL(order)}` },
            { icon: Sprout, label: "Arriving", when: eta.toLocaleDateString("en-ZA", { day: "numeric", month: "long" }) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/12 bg-white/5 p-5">
              <s.icon size={17} className="text-[var(--lime)]" />
              <p className="mt-4 text-[13px] font-bold text-white">{s.label}</p>
              <p className="mt-1 text-[12.5px] text-white/55">{s.when}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-[1000px] px-5 pb-24 md:px-8">
        {loaded && order ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
            className="rounded-[28px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6 md:p-9"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Delivering to</p>
                <p className="mt-2 text-[14.5px] font-semibold">{order.contact.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[rgba(13,22,16,.58)]">
                  {order.ship.address}
                  {order.ship.suburb ? `, ${order.ship.suburb}` : ""}
                  <br />
                  {order.ship.city}, {order.ship.province} {order.ship.postal}
                </p>
              </div>
              <div className="text-right">
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Total paid</p>
                <p className="display mt-2 text-[32px] tabular-nums">{money(order.total)}</p>
                <p className="mt-1 text-[12px] text-[rgba(13,22,16,.45)]">
                  incl. {money(order.delivery)} delivery
                </p>
              </div>
            </div>

            <ul className="mt-8 divide-y divide-[rgba(28,58,41,.1)] border-t border-[rgba(28,58,41,.1)]">
              {order.items.map((item) => {
                const product = getProduct(item.slug);
                return (
                  <li key={`${item.slug}-${item.variant ?? ""}-${item.recipe ?? ""}`} className="flex items-center gap-4 py-4">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      {product ? (
                        <ProductImage product={product} sizes="56px" swatchLabel={false} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{item.name}</span>
                      <span className="block text-[12px] text-[rgba(13,22,16,.45)]">
                        {item.variant ?? ""} {item.recipe ? `· ${item.recipe}` : ""}
                      </span>
                    </span>
                    <span className="text-[12.5px] text-[rgba(13,22,16,.5)]">×{item.qty}</span>
                    <span className="display w-20 text-right text-[15px] tabular-nums">
                      {money(item.price * item.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop/plants"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--moss)] px-6 text-[14px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
              >
                Keep shopping <ArrowRight size={16} />
              </Link>
              <Link
                href="/shop/mix"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[rgba(28,58,41,.2)] px-6 text-[14px] font-bold text-[var(--moss)] hover:bg-[rgba(28,58,41,.05)]"
              >
                Plan the next repot
              </Link>
            </div>
          </motion.div>
        ) : null}

        {loaded && !order ? (
          <div className="rounded-[28px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-8 text-center">
            <p className="display text-[22px]">We cannot find that order on this device.</p>
            <p className="mt-2 text-[13.5px] text-[rgba(13,22,16,.55)]">
              Order details are stored locally in this browser. Your reference is still{" "}
              <span className="font-bold">{reference}</span> — quote it in an email and we will pull
              it up.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--moss)] px-6 text-[14px] font-bold text-[var(--bone)]"
            >
              Back to the shop <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12.5px] text-[rgba(13,22,16,.5)]">
          <span className="flex items-center gap-2">
            <Mail size={14} className="text-[var(--leaf)]" /> Tracking sent by email
          </span>
          <span className="flex items-center gap-2">
            <Check size={14} className="text-[var(--leaf)]" /> 14-day arrival promise
          </span>
          <span className="flex items-center gap-2">
            <Check size={14} className="text-[var(--leaf)]" /> Replaces, not refunds
          </span>
        </div>
      </div>
    </div>
  );
}

function DELIVERY_LABEL(order: StoredOrder | null) {
  return order?.speed === "express" ? "Next working day" : "2–4 working days";
}
