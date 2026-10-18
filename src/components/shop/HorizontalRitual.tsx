"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PANELS = [
  {
    n: "01",
    kicker: "Choose",
    title: "Pick for the room, not the photograph.",
    body: "Light is the only non-negotiable. Tell us how bright your corner is and we will show you what survives it — before you fall in love with something that needs a greenhouse.",
    image: "/shop/plants/monstera-albo.webp",
    alt: "Monstera Albo in a terracotta pot",
    cta: { href: "/shop/finder", label: "Find your plant" },
  },
  {
    n: "02",
    kicker: "Build",
    title: "Soil is a recipe, not a product.",
    body: "Coir for body, perlite for air, castings for food, biochar for the long game. Move four sliders and watch the drainage, moisture and biology shift in real time.",
    cta: { href: "/shop/mix", label: "Open the Mix Lab" },
  },
  {
    n: "03",
    kicker: "Feed",
    title: "Feed on a rhythm, not a feeling.",
    body: "Our powders are milled for soft South African water. One gram in a litre, once a week in the growing months, and nothing at all in mid-winter.",
    image: "/shop/nutrients/grow-20-10-20.webp",
    alt: "Scoop of pale blue-green nutrient powder beside a kraft pouch",
    cta: { href: "/shop/nutrients", label: "See the nutrients" },
  },
  {
    n: "04",
    kicker: "Repot",
    title: "Wait for the roots to ask.",
    body: "When roots circle the base or water runs straight through, it is time. Go one pot size up, dust the roots with inoculant, and use the same mix that got it there.",
    image: "/shop/scenes/hero.webp",
    alt: "Potting bench with plants and substrate",
    cta: { href: "/shop/substrate", label: "Stock the soil bar" },
  },
];

function SoilColumn() {
  const layers = [
    { label: "Coir 40 %", from: "#8a6239", to: "#c39a6b", h: 26 },
    { label: "Castings 20 %", from: "#2c2118", to: "#6f5a3e", h: 16 },
    { label: "Perlite 20 %", from: "#b9bbb6", to: "#f2f3ef", h: 18 },
    { label: "Vermiculite 10 %", from: "#7a5a2e", to: "#d7b173", h: 14 },
    { label: "Biochar 10 %", from: "#141414", to: "#4a4a48", h: 16 },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="relative w-[190px] overflow-hidden rounded-[34px] border border-[rgba(13,22,16,.14)] bg-white/50 p-2 shadow-[0_30px_60px_-30px_rgba(13,22,16,.5)] backdrop-blur">
        <div className="flex flex-col-reverse overflow-hidden rounded-[26px]">
          {layers.map((l, i) => (
            <motion.div
              key={l.label}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: `${l.h * 4}px`,
                background: `linear-gradient(180deg, ${l.from}, ${l.to})`,
                transformOrigin: "bottom",
              }}
              className="relative flex items-center justify-center"
            >
              <span className="text-[9px] font-bold uppercase tracking-[.14em] text-white/85 mix-blend-difference">
                {l.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <p className="max-w-[240px] text-center text-[12px] leading-relaxed text-[rgba(13,22,16,.5)]">
        A five-part mix, built in the Lab and shipped as separate bags.
      </p>
    </div>
  );
}

export function HorizontalRitual() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const x = useSpring(rawX, { stiffness: 110, damping: 26, mass: 0.6 });
  const barWidth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth + 48));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative bg-[var(--ink)]"
      style={{ height: reduce ? "auto" : `${(PANELS.length + 1) * 78}vh` }}
    >
      <div
        className={`${reduce ? "" : "sticky top-0"} flex h-[100svh] flex-col justify-center overflow-hidden`}
      >
        <div className="mx-auto mb-8 flex w-full max-w-[1400px] items-center gap-6 px-5 md:px-8">
          <p className="eyebrow shrink-0 text-[var(--lime)]">The ritual</p>
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/12">
            <motion.div
              style={{ scaleX: barWidth, originX: 0 }}
              className="absolute inset-0 bg-[var(--lime)]"
            />
          </div>
        </div>

        <motion.div
          ref={trackRef}
          style={reduce ? undefined : { x }}
          className={`flex gap-6 px-5 md:gap-10 md:px-8 ${reduce ? "flex-wrap justify-center" : "w-max"}`}
        >
          {PANELS.map((p) => (
            <article
              key={p.n}
              className={`relative flex h-[62vh] min-h-[460px] shrink-0 flex-col justify-end overflow-hidden rounded-[28px] border border-white/12 bg-[var(--moss-deep)] p-7 md:p-9 ${
                reduce ? "w-[340px]" : "w-[82vw] max-w-[620px]"
              }`}
            >
              {p.image ? (
                <>
                  <Image
                    src={p.image}
                    alt={p.alt ?? ""}
                    fill
                    sizes="(max-width: 768px) 82vw, 620px"
                    className="object-cover opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.96)] via-[rgba(9,20,14,.55)] to-[rgba(9,20,14,.2)]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-[var(--bone)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-[86%] w-[86%]">
                      <SoilColumn />
                    </div>
                  </div>
                </>
              )}

              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <span className="display text-[13px] text-[var(--lime)]">{p.n}</span>
                  <span className="h-px w-8 bg-[var(--lime)]/50" />
                  <span className="eyebrow text-white/60">{p.kicker}</span>
                </div>
                <h3 className="display mt-4 max-w-[16ch] text-[clamp(1.7rem,3.6vw,2.7rem)] text-white">
                  {p.title}
                </h3>
                <p className="mt-4 max-w-[38ch] text-[14.5px] leading-relaxed text-white/65">
                  {p.body}
                </p>
                <Link
                  href={p.cta.href}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition-colors hover:bg-[var(--lime)] hover:text-[var(--moss-deep)]"
                >
                  {p.cta.label}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </article>
          ))}

          {/* closing CTA panel */}
          <article className="relative flex h-[62vh] min-h-[460px] shrink-0 flex-col justify-between overflow-hidden rounded-[28px] bg-[var(--lime)] p-7 md:p-9 w-[82vw] max-w-[520px]">
            <p className="display text-[clamp(1.9rem,3.4vw,2.6rem)] text-[var(--moss-deep)]">
              Or let the Lab do the arithmetic.
            </p>
            <div>
              <p className="max-w-[32ch] text-[14.5px] leading-relaxed text-[rgba(20,42,30,.72)]">
                Choose a plant and a pot size. We will work out the litres, the ratios and the grams
                per litre, then send the whole recipe in one box.
              </p>
              <Link
                href="/shop/mix"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--moss-deep)] px-6 py-3.5 text-[14px] font-bold text-[var(--lime)]"
              >
                Open the Mix Lab →
              </Link>
            </div>
          </article>
        </motion.div>
      </div>
    </section>
  );
}
