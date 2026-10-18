"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CreditCard, Lock, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DELIVERY, money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";

type Errors = Record<string, string>;

const STEPS = [
  { id: "contact", label: "Contact", icon: User },
  { id: "delivery", label: "Delivery", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
];

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.62)]">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-12 w-full rounded-xl border bg-[var(--bone)] px-4 text-[14.5px] outline-none transition-colors placeholder:text-[rgba(13,22,16,.3)] ${
          error ? "border-[var(--clay)]" : "border-[rgba(28,58,41,.16)] focus:border-[var(--leaf)]"
        }`}
      />
      {error ? <span className="mt-1.5 block text-[11.5px] text-[var(--clay)]">{error}</span> : null}
    </label>
  );
}

export function CheckoutFlow() {
  const { lines, subtotal, delivery, total, clear, hydrated } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [ship, setShip] = useState({
    address: "",
    suburb: "",
    city: "",
    province: "KwaZulu-Natal",
    postal: "",
    notes: "",
  });
  const [speed, setSpeed] = useState<"standard" | "express">("standard");

  const expressFee = speed === "express" ? DELIVERY.express - DELIVERY.standard : 0;
  const grandTotal = subtotal === 0 ? 0 : total + expressFee;

  const validate = (): boolean => {
    const e: Errors = {};
    if (step === 0) {
      if (contact.name.trim().length < 2) e.name = "We need a name for the delivery";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) e.email = "That email looks off";
      if (contact.phone.replace(/\D/g, "").length < 9) e.phone = "A number the courier can reach";
    }
    if (step === 1) {
      if (ship.address.trim().length < 4) e.address = "Street address, please";
      if (ship.city.trim().length < 2) e.city = "Which city or town?";
      if (!/^\d{4}$/.test(ship.postal)) e.postal = "Four digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((s) => Math.min(2, s + 1));
  };

  const placeOrder = () => {
    setPlacing(true);
    const ref = `HLZ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = {
      ref,
      placedAt: new Date().toISOString(),
      items: lines.map((l) => ({
        slug: l.slug,
        name: l.product.name,
        variant: l.variant,
        recipe: l.recipe,
        qty: l.qty,
        price: l.unit,
      })),
      subtotal,
      delivery: subtotal === 0 ? 0 : delivery + expressFee,
      total: grandTotal,
      contact,
      ship,
      speed,
    };
    try {
      window.localStorage.setItem("hlaza.lastOrder.v1", JSON.stringify(order));
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      clear();
      router.push(`/shop/order/${ref}`);
    }, 900);
  };

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-32 text-center md:px-8">
        <h1 className="display text-[clamp(2rem,5vw,3.2rem)]">Your bag is empty.</h1>
        <p className="mt-4 text-[15px] text-[rgba(13,22,16,.6)]">
          Add something alive (or something powdered) and come back.
        </p>
        <Link
          href="/shop/plants"
          className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-[var(--moss)] px-7 py-4 text-[14.5px] font-bold text-[var(--bone)]"
        >
          Shop living things <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-28 md:px-8 md:pt-36">
      <button
        type="button"
        onClick={() => (step === 0 ? router.push("/shop/cart") : setStep((s) => s - 1))}
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-bold text-[rgba(13,22,16,.5)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={14} /> {step === 0 ? "Back to bag" : "Previous step"}
      </button>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:gap-16">
        <div>
          {/* step rail */}
          <div className="flex items-center gap-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.id} className="flex flex-1 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={`flex h-10 items-center gap-2.5 rounded-full border px-4 text-[13px] font-bold transition-all ${
                      active
                        ? "border-[var(--moss)] bg-[var(--moss)] text-[var(--bone)]"
                        : done
                          ? "border-[rgba(51,104,76,.4)] bg-[rgba(51,104,76,.08)] text-[var(--leaf)]"
                          : "border-[rgba(28,58,41,.14)] text-[rgba(13,22,16,.4)]"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                  {i < STEPS.length - 1 ? (
                    <span
                      className={`h-px flex-1 ${done ? "bg-[var(--leaf)]" : "bg-[rgba(28,58,41,.14)]"}`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 ? (
                  <div>
                    <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Who is it for?</h1>
                    <p className="mt-3 text-[14px] text-[rgba(13,22,16,.58)]">
                      We only use this to get the box to you and to send the courier note.
                    </p>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          label="Full name"
                          value={contact.name}
                          onChange={(v) => setContact({ ...contact, name: v })}
                          error={errors.name}
                          placeholder="Nomsa Dlamini"
                          autoComplete="name"
                        />
                      </div>
                      <Field
                        label="Email"
                        type="email"
                        value={contact.email}
                        onChange={(v) => setContact({ ...contact, email: v })}
                        error={errors.email}
                        placeholder="you@example.co.za"
                        autoComplete="email"
                      />
                      <Field
                        label="Phone"
                        value={contact.phone}
                        onChange={(v) => setContact({ ...contact, phone: v })}
                        error={errors.phone}
                        placeholder="082 000 0000"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div>
                    <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Where is it going?</h1>
                    <p className="mt-3 text-[14px] text-[rgba(13,22,16,.58)]">
                      Plants are dispatched Monday to Wednesday so nothing sits in a depot over a
                      weekend.
                    </p>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          label="Street address"
                          value={ship.address}
                          onChange={(v) => setShip({ ...ship, address: v })}
                          error={errors.address}
                          placeholder="14 Acacia Road"
                          autoComplete="address-line1"
                        />
                      </div>
                      <Field
                        label="Suburb (optional)"
                        value={ship.suburb}
                        onChange={(v) => setShip({ ...ship, suburb: v })}
                        placeholder="Ballito"
                      />
                      <Field
                        label="City or town"
                        value={ship.city}
                        onChange={(v) => setShip({ ...ship, city: v })}
                        error={errors.city}
                        placeholder="KwaDukuza"
                        autoComplete="address-level2"
                      />
                      <label className="block">
                        <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.62)]">
                          Province
                        </span>
                        <select
                          value={ship.province}
                          onChange={(e) => setShip({ ...ship, province: e.target.value })}
                          className="mt-2 h-12 w-full rounded-xl border border-[rgba(28,58,41,.16)] bg-[var(--bone)] px-4 text-[14.5px] outline-none focus:border-[var(--leaf)]"
                        >
                          {DELIVERY.regions.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                      <Field
                        label="Postal code"
                        value={ship.postal}
                        onChange={(v) => setShip({ ...ship, postal: v })}
                        error={errors.postal}
                        placeholder="4450"
                        autoComplete="postal-code"
                      />
                      <div className="sm:col-span-2">
                        <label className="block">
                          <span className="text-[12.5px] font-semibold text-[rgba(13,22,16,.62)]">
                            Delivery notes (optional)
                          </span>
                          <textarea
                            value={ship.notes}
                            onChange={(e) => setShip({ ...ship, notes: e.target.value })}
                            rows={3}
                            placeholder="Leave with the neighbour at number 16 if we are out."
                            className="mt-2 w-full rounded-xl border border-[rgba(28,58,41,.16)] bg-[var(--bone)] px-4 py-3 text-[14.5px] outline-none focus:border-[var(--leaf)]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          id: "standard" as const,
                          label: "Standard",
                          detail: `${DELIVERY.leadTime} · ${money(DELIVERY.standard)}`,
                          fee: DELIVERY.standard,
                        },
                        {
                          id: "express" as const,
                          label: "Express",
                          detail: "Next working day · " + money(DELIVERY.express),
                          fee: DELIVERY.express,
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSpeed(opt.id)}
                          className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all ${
                            speed === opt.id
                              ? "border-[var(--moss)] bg-[rgba(51,104,76,.06)]"
                              : "border-[rgba(28,58,41,.14)] hover:border-[rgba(28,58,41,.3)]"
                          }`}
                        >
                          <span>
                            <span className="block text-[14.5px] font-bold">{opt.label}</span>
                            <span className="block text-[12px] text-[rgba(13,22,16,.5)]">
                              {opt.detail}
                            </span>
                          </span>
                          <span className="display text-[17px]">{money(opt.fee)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div>
                    <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Payment</h1>
                    <p className="mt-3 text-[14px] text-[rgba(13,22,16,.58)]">
                      This is a demonstration storefront — no card is charged and nothing is sent to
                      a payment provider.
                    </p>

                    <div className="mt-8 rounded-2xl border border-[rgba(28,58,41,.14)] bg-[var(--paper)] p-6">
                      <div className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--moss)]">
                        <Lock size={13} /> Payfast · secure checkout
                      </div>
                      <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Card number" value="" onChange={() => {}} placeholder="4242 4242 4242 4242" />
                        </div>
                        <Field label="Expiry" value="" onChange={() => {}} placeholder="09 / 28" />
                        <Field label="CVV" value="" onChange={() => {}} placeholder="123" />
                      </div>
                      <p className="mt-5 text-[11.5px] leading-relaxed text-[rgba(13,22,16,.45)]">
                        Card fields are inert in this demo. Pressing place order simulates a
                        successful payment and clears your bag.
                      </p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center gap-4">
            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex h-14 items-center gap-2 rounded-2xl bg-[var(--moss)] px-8 text-[15px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
              >
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={placeOrder}
                disabled={placing}
                className="inline-flex h-14 items-center gap-2 rounded-2xl bg-[var(--moss)] px-8 text-[15px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)] disabled:opacity-60"
              >
                {placing ? "Placing order…" : `Place order · ${money(grandTotal)}`}
              </button>
            )}
            <p className="text-[12px] text-[rgba(13,22,16,.45)]">
              Free delivery over {money(DELIVERY.freeOver)} · 14-day arrival promise
            </p>
          </div>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[26px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
            <p className="eyebrow text-[rgba(13,22,16,.4)]">Order summary</p>
            <ul className="mt-5 space-y-4">
              {lines.map((l) => (
                <li key={`${l.slug}-${l.recipe ?? ""}-${l.variant ?? ""}`} className="flex gap-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage product={l.product} sizes="56px" swatchLabel={false} />
                    <span className="absolute bottom-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-tl-lg bg-[var(--moss)] px-1 text-[10px] font-bold text-[var(--bone)]">
                      {l.qty}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {l.product.name}
                    </span>
                    <span className="block text-[11.5px] text-[rgba(13,22,16,.45)]">
                      {l.variant ?? l.product.size}
                    </span>
                  </span>
                  <span className="display shrink-0 text-[15px] tabular-nums">
                    {money(l.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-2.5 border-t border-[rgba(28,58,41,.1)] pt-5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-[rgba(13,22,16,.6)]">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgba(13,22,16,.6)]">Delivery</dt>
                <dd className="font-semibold tabular-nums">
                  {subtotal === 0 ? "—" : delivery === 0 ? "Free" : money(delivery)}
                </dd>
              </div>
              {speed === "express" ? (
                <div className="flex justify-between">
                  <dt className="text-[rgba(13,22,16,.6)]">Express upgrade</dt>
                  <dd className="font-semibold tabular-nums">{money(expressFee)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-[rgba(28,58,41,.1)] pt-3">
                <dt className="display text-[19px]">Total</dt>
                <dd className="display text-[26px] tabular-nums">{money(grandTotal)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
