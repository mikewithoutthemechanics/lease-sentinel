"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { RevealText } from "./Reveal";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.22]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.62], [1, 0]);
  const leafY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const cardY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -120]), {
    stiffness: 90,
    damping: 24,
  });

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[660px] w-full overflow-hidden bg-[var(--moss-deep)]">
      {/* background plate */}
      <motion.div
        style={reduce ? undefined : { y: imageY, scale: imageScale }}
        className="absolute inset-0"
      >
        <Image
          src="/shop/scenes/hero.webp"
          alt="A sunlit potting corner filled with houseplants, powder nutrients and substrate"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(9,20,14,.9)] via-[rgba(9,20,14,.62)] to-[rgba(9,20,14,.25)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.92)] via-transparent to-[rgba(9,20,14,.5)]" />

      {/* drifting foliage silhouettes */}
      {!reduce ? (
        <motion.div style={{ y: leafY }} className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="sway absolute -left-16 bottom-0 h-[62vh] w-auto opacity-45 text-[var(--moss)]"
            viewBox="0 0 220 320"
            fill="none"
            aria-hidden
          >
            <path
              d="M20 320C10 240 26 170 78 118c46-46 118-48 140-96 2 58-34 106-92 138-38 21-62 48-70 160Z"
              fill="currentColor"
            />
            <path d="M40 320c-6-64 6-114 46-152" stroke="currentColor" strokeWidth="3" opacity=".5" />
          </svg>
          <svg
            className="sway absolute -right-24 -top-10 h-[54vh] w-auto opacity-35 text-[var(--leaf)]"
            style={{ animationDelay: "-4s" }}
            viewBox="0 0 240 300"
            fill="none"
            aria-hidden
          >
            <path
              d="M240 10C170 18 118 66 96 132c-20 62-6 118 30 168 22-64 12-116-14-152 40 30 82 46 128 46V10Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      ) : null}

      {/* copy */}
      <motion.div
        style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-24 md:px-8 md:pb-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mb-7 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lime)] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[.2em] text-white/85">
            Potted and blended in KwaZulu-Natal
          </span>
        </motion.div>

        <h1 className="display max-w-[15ch] text-[clamp(3rem,10.5vw,7.5rem)] text-white">
          <RevealText text="Grow something" delay={0.35} />
          <br />
          <em className="not-italic text-[var(--lime)]">
            <RevealText text="that outlives the trend." delay={0.55} />
          </em>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05 }}
          className="mt-7 max-w-lg text-[16px] leading-relaxed text-white/70"
        >
          Living plants, water-soluble nutrient powders and the separate parts of a good soil —
          sold apart, so you can build the exact mix your room and your watering habits deserve.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.18 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/shop/plants"
            className="group inline-flex h-13 items-center gap-2 rounded-full bg-[var(--lime)] px-7 py-4 text-[14.5px] font-bold text-[var(--moss-deep)] transition-all hover:gap-3"
          >
            Shop living things
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/shop/mix"
            className="inline-flex h-13 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-4 text-[14.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/12"
          >
            Build a mix in the Lab
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-12 flex flex-wrap gap-x-10 gap-y-3 text-[12px] uppercase tracking-[.16em] text-white/45"
        >
          {["Peat-free", "14-day arrival promise", "Free delivery over R750"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--lime)]/70" />
              {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* floating specimen card */}
      {!reduce ? (
        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, x: 60, rotate: -4 }}
          animate={{ opacity: 1, x: 0, rotate: -3 }}
          transition={{ duration: 1.2, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-6 top-[16%] z-10 hidden w-[290px] rounded-3xl border border-white/15 bg-white/10 p-3.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] backdrop-blur-2xl lg:block"
        >
          <div className="relative h-[190px] overflow-hidden rounded-2xl">
            <Image
              src="/shop/plants/monstera-albo.webp"
              alt="Monstera Albo"
              fill
              sizes="300px"
              className="object-cover"
            />
          </div>
          <div className="px-1.5 pb-1 pt-3.5">
            <p className="eyebrow text-[var(--lime)]">Specimen 014</p>
            <p className="display mt-1.5 text-[22px] leading-tight text-white">Monstera Albo</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-[13px] text-white/55">19 cm · variegated</p>
              <p className="display text-[20px] text-white">R 649</p>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        style={reduce ? undefined : { opacity: copyOpacity }}
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/45 md:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[.28em]">Scroll</span>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
        >
          <ArrowDown size={15} />
        </motion.span>
      </motion.div>
    </section>
  );
}
