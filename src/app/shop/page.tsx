import { ArrowRight, Package, Shovel, Sprout, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/shop/Hero";
import { HorizontalRitual } from "@/components/shop/HorizontalRitual";
import { MixTeaser } from "@/components/shop/MixTeaser";
import { ProductCard } from "@/components/shop/ProductCard";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { Reveal } from "@/components/shop/Reveal";
import { CATEGORIES, PRODUCTS } from "@/lib/shop/catalogue";

const FEATURED = [
  "monstera-albo",
  "grow-20-10-20",
  "perlite",
  "zz-raven",
  "worm-castings",
  "cal-mag",
];

const PROMISES = [
  { icon: Truck, title: "Plant post", text: "Sealed boxes, a 14-day arrival promise, no bare-root surprises." },
  { icon: Package, title: "Small-batch powders", text: "Milled monthly in Durban so nothing cakes in the tin." },
  { icon: Shovel, title: "Buy the parts", text: "Amendments sold separately — build a mix, not a compromise." },
  { icon: Sprout, title: "Grown here", text: "Every plant acclimatised in KwaZulu-Natal before it ships." },
];

function SoilBands() {
  const bands = [
    { h: 30, from: "#8a6239", to: "#c39a6b" },
    { h: 18, from: "#2c2118", to: "#6f5a3e" },
    { h: 20, from: "#b9bbb6", to: "#f2f3ef" },
    { h: 14, from: "#7a5a2e", to: "#d7b173" },
    { h: 18, from: "#141414", to: "#4a4a48" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col-reverse">
      {bands.map((b, i) => (
        <div
          key={i}
          style={{ height: `${b.h}%`, background: `linear-gradient(180deg, ${b.from}, ${b.to})` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.55)] to-transparent" />
    </div>
  );
}

export default function ShopHome() {
  const featured = FEATURED.map((slug) => PRODUCTS.find((p) => p.slug === slug)!);

  return (
    <>
      <Hero />

      {/* promises */}
      <section className="border-b border-[rgba(28,58,41,.1)] bg-[var(--paper)]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(51,104,76,.09)] text-[var(--leaf)]">
                  <p.icon size={18} />
                </span>
                <div>
                  <p className="text-[14px] font-bold">{p.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[rgba(13,22,16,.55)]">
                    {p.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* three rooms */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-[rgba(13,22,16,.4)]">Three rooms, one shop</p>
              <h2 className="display mt-3 max-w-[22ch] text-[clamp(2rem,5vw,3.6rem)]">
                The plant, the food, and the ground it stands in.
              </h2>
            </div>
            <Link
              href="/shop/collections"
              className="group inline-flex items-center gap-2 text-[14px] font-bold text-[var(--leaf)]"
            >
              See everything
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {[
            { ...CATEGORIES.plants, href: "/shop/plants", img: "/shop/plants/philodendron-pink-princess.webp" },
            { ...CATEGORIES.nutrients, href: "/shop/nutrients", img: "/shop/nutrients/grow-20-10-20.webp" },
            { ...CATEGORIES.substrate, href: "/shop/substrate", img: null },
          ].map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 0.1}>
              <Link
                href={cat.href}
                className="group relative flex h-[440px] flex-col justify-end overflow-hidden rounded-[26px] p-7"
              >
                {cat.img ? (
                  <>
                    <Image
                      src={cat.img}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 460px"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.92)] via-[rgba(9,20,14,.4)] to-[rgba(9,20,14,.1)]" />
                  </>
                ) : (
                  <>
                    <SoilBands />
                    <span className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.85)] via-transparent to-transparent" />
                  </>
                )}

                <div className="relative">
                  <p className="eyebrow text-[var(--lime)]">{cat.eyebrow}</p>
                  <h3 className="display mt-2.5 text-[34px] leading-none text-white">
                    {cat.label}
                  </h3>
                  <p className="mt-3.5 max-w-[34ch] text-[14px] leading-relaxed text-white/65">
                    {cat.blurb}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-white">
                    Enter the room
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* featured */}
      <section className="border-y border-[rgba(28,58,41,.1)] bg-[var(--paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Moving fastest</p>
                <h2 className="display mt-3 text-[clamp(1.8rem,4vw,2.8rem)]">
                  What everybody is potting this month
                </h2>
              </div>
              <p className="max-w-xs text-[13px] leading-relaxed text-[rgba(13,22,16,.5)]">
                Ranked by what is actually leaving the greenhouse, not by margin.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <HorizontalRitual />

      {/* mix lab + finder */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <MixTeaser />
        </Reveal>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <Reveal delay={0.08}>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[rgba(28,58,41,.1)] bg-[var(--paper)] p-7 md:p-10">
              <div>
                <p className="eyebrow text-[var(--clay)]">Not sure where to start?</p>
                <h3 className="display mt-3 max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.6rem)]">
                  Four questions. One honest shortlist.
                </h3>
                <ol className="mt-7 space-y-3.5 text-[14px] text-[rgba(13,22,16,.6)]">
                  {[
                    "How much light does the spot actually get?",
                    "How often will you honestly water it?",
                    "Are there cats, dogs or toddlers in the room?",
                    "Do you want a statement or something quiet?",
                  ].map((q, i) => (
                    <li key={q} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(201,111,74,.14)] text-[11px] font-bold text-[var(--clay)]">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
              <Link
                href="/shop/finder"
                className="mt-8 inline-flex h-13 w-fit items-center gap-2 rounded-full bg-[var(--moss)] px-7 py-4 text-[14.5px] font-bold text-[var(--bone)] transition-colors hover:bg-[var(--leaf)]"
              >
                Match me with a plant <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <Link
              href="/shop/nutrients"
              className="group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-[28px] p-7"
            >
              <Image
                src="/shop/nutrients/cal-mag.webp"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover transition-transform duration-[1.2s] group-hover:scale-108"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[rgba(9,20,14,.9)] to-[rgba(9,20,14,.15)]" />
              <div className="relative">
                <p className="eyebrow text-[var(--lime)]">Because our water is soft</p>
                <h3 className="display mt-2.5 text-[30px] leading-none text-white">
                  Cal-Mag is not optional
                </h3>
                <p className="mt-3 max-w-[32ch] text-[13.5px] leading-relaxed text-white/65">
                  Coastal municipal water is soft and slightly acidic. Without a calcium and
                  magnesium top-up, new leaves cup and tips go papery no matter how good your main
                  feed is.
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* reviews */}
      <section className="bg-[var(--moss-deep)] py-16 text-white md:py-24">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <Reveal>
            <p className="eyebrow text-[var(--lime)]">From the potting bench</p>
            <h2 className="display mt-3 max-w-[20ch] text-[clamp(2rem,4.4vw,3.2rem)] text-white">
              “It arrived with roots, not apologies.”
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  "Third Monstera I have bought online and the first one that did not sulk for a month. The variegation is still throwing white.",
                who: "Thandi M.",
                where: "Durban North",
              },
              {
                quote:
                  "I built an aroid mix in the Lab, bought exactly the litres it said, and had no leftover bags on the floor. That never happens.",
                who: "Werner P.",
                where: "Stellenbosch",
              },
              {
                quote:
                  "The feeding schedule told me one 500 g tin lasts 40 weeks. It did. Nobody else puts that on the tin.",
                who: "Ayesha K.",
                where: "Bedfordview",
              },
            ].map((r, i) => (
              <Reveal key={r.who} delay={i * 0.09}>
                <figure className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
                  <blockquote className="text-[14.5px] leading-relaxed text-white/75">
                    “{r.quote}”
                  </blockquote>
                  <figcaption className="mt-6 text-[12px] font-bold uppercase tracking-[.14em] text-[var(--lime)]">
                    {r.who} · {r.where}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <RecentlyViewed />
    </>
  );
}
