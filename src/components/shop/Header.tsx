"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";

/** Routes that open on a dark hero — the header inverts over them. */
function hasDarkHero(pathname: string) {
  return (
    pathname === "/shop" ||
    pathname === "/shop/mix" ||
    pathname === "/shop/finder" ||
    pathname === "/shop/about" ||
    pathname.startsWith("/shop/order/")
  );
}

const NAV = [
  { href: "/shop/plants", label: "Living things" },
  { href: "/shop/nutrients", label: "Nutrients" },
  { href: "/shop/substrate", label: "Substrate" },
  { href: "/shop/mix", label: "Mix Lab" },
  { href: "/shop/finder", label: "Plant finder" },
];

export function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 29V13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity=".55"
      />
      <path
        d="M16 4c7.2 0 11 4.6 11 11.4 0 4.4-2.6 7.3-6.3 7.3-2.9 0-4.7-1.7-4.7-4.3V4Z"
        fill="currentColor"
        opacity=".92"
      />
      <path
        d="M15.2 7.6C10.4 8.4 7 11.9 7 16.6c0 3.9 2.3 6.4 5.6 6.4 2.6 0 4.2-1.5 4.2-3.8V7.6h-1.6Z"
        fill="currentColor"
        opacity=".6"
      />
    </svg>
  );
}

export function ShopHeader() {
  const { count, openCart, pulse, subtotal } = useCart();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  const solid = scrolled || menu;
  const overDark = !solid && hasDarkHero(pathname);

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid
            ? "border-b border-[rgba(28,58,41,.1)] bg-[rgba(246,243,234,.86)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-[74px] md:px-8">
          <Link href="/shop" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--moss)] text-[var(--lime)]">
              <LeafMark className="h-5 w-5" />
            </span>
            <span
              className={`display text-[21px] leading-none tracking-tight transition-colors ${
                overDark ? "text-white" : "text-[var(--ink)]"
              }`}
            >
              Hlaza
              <span
                className={`ml-2 hidden text-[10px] font-sans font-bold uppercase tracking-[.2em] sm:inline ${
                  overDark ? "text-white/55" : "text-[rgba(13,22,16,.45)]"
                }`}
              >
                Living Supply Co.
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenu(false)}
                  className={`link-rule relative rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                    overDark
                      ? active
                        ? "text-[var(--lime)]"
                        : "text-white/70 hover:text-white"
                      : active
                        ? "text-[var(--moss)]"
                        : "text-[rgba(13,22,16,.6)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              className={`group flex h-10 items-center gap-2.5 rounded-full border pl-4 pr-1.5 text-[13px] font-semibold backdrop-blur transition-all ${
                overDark
                  ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                  : "border-[rgba(28,58,41,.16)] bg-[var(--paper)]/70 text-[var(--moss)] hover:border-[var(--moss)] hover:bg-[var(--paper)]"
              }`}
            >
              <span className="hidden sm:inline">{subtotal > 0 ? money(subtotal) : "Bag"}</span>
              <motion.span
                key={pulse}
                initial={pulse ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 14 }}
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[12px] font-bold ${
                  overDark ? "bg-[var(--lime)] text-[var(--moss-deep)]" : "bg-[var(--moss)] text-[var(--bone)]"
                }`}
              >
                {count}
              </motion.span>
            </button>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${
                overDark
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-[rgba(28,58,41,.16)] bg-[var(--paper)]/70 text-[var(--moss)]"
              }`}
              aria-label="Toggle menu"
            >
              {menu ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menu ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-[rgba(28,58,41,.1)] bg-[var(--paper)]/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col px-5 py-3">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenu(false)}
                    className="display border-b border-[rgba(28,58,41,.07)] py-3.5 text-[22px] last:border-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      {/* floating bag on mobile */}
      <button
        type="button"
        onClick={openCart}
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[var(--moss)] pl-5 pr-6 text-[14px] font-semibold text-[var(--bone)] shadow-[0_18px_40px_-12px_rgba(13,22,16,.6)] md:hidden"
      >
        <ShoppingBag size={18} />
        {count > 0 ? `${count} · ${money(subtotal)}` : "Bag"}
      </button>
    </>
  );
}
