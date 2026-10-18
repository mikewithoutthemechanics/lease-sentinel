import { ArrowRight, Check, ChevronRight, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkViewed } from "@/components/shop/MarkViewed";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductPurchase } from "@/components/shop/ProductPurchase";
import { Reveal } from "@/components/shop/Reveal";
import { CATEGORIES, PRODUCTS, RECIPES, getProduct, pairingsFor } from "@/lib/shop/catalogue";
import { money } from "@/lib/shop/format";
import type { Product } from "@/lib/shop/types";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found | Hlaza" };
  return {
    title: `${product.name} | Hlaza`,
    description: product.tagline,
  };
}

const PLANT_RECIPE: Record<string, string> = {
  "monstera-albo": "Aroid Mix",
  "philodendron-pink-princess": "Aroid Mix",
  "fiddle-leaf-fig": "Ficus & Strelitzia",
  "strelitzia-nicolai": "Ficus & Strelitzia",
  "zz-raven": "Dry-Rhythm Mix",
};

const REVIEWERS = [
  ["Thandi M.", "Durban North"],
  ["Werner P.", "Stellenbosch"],
  ["Ayesha K.", "Bedfordview"],
  ["Liam N.", "Umhlanga"],
  ["Nadia S.", "Centurion"],
];

const REVIEW_COPY: Record<string, string[]> = {
  plants: [
    "Arrived with the moss pole still damp and the roots already wrapped. Two new leaves since it landed.",
    "I have killed two of these before. This one is still going after three months, which is a record for me.",
    "Packaging was genuinely over-engineered — not a single bent leaf on arrival.",
  ],
  nutrients: [
    "Dissolves completely. No grit in the bottom of the can, and it has not blocked my rose once.",
    "The tin has lasted far longer than I expected at the dose printed on the side.",
    "First powder I have used that does not cake into a brick in coastal humidity.",
  ],
  substrate: [
    "Low dust, consistent grain, and the bag is actually the volume it claims on the label.",
    "Mixed it in the ratios the Lab suggested and the drainage behaves exactly as predicted.",
    "Third bag. It just works, and the price has not crept up every few months.",
  ],
};

function Dots({ value, label, invert = false }: { value: number; label: string; invert?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-[rgba(13,22,16,.6)]">{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i < value ? (invert ? "bg-[var(--lime)]" : "bg-[var(--leaf)]") : "bg-[rgba(28,58,41,.12)]"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

function CarePanel({ product }: { product: Product }) {
  if (!product.care) return null;
  const recipe = PLANT_RECIPE[product.slug];
  return (
    <div className="rounded-[24px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
      <p className="eyebrow text-[rgba(13,22,16,.4)]">Care, honestly</p>
      <div className="mt-5 space-y-3.5">
        <Dots value={product.care.light} label="Light demand" />
        <Dots value={product.care.water} label="Watering frequency" />
        <Dots value={product.care.humidity} label="Humidity tolerance" />
        <Dots value={product.care.difficulty} label="Fussiness" />
      </div>
      {recipe ? (
        <Link
          href="/shop/mix"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-[rgba(51,104,76,.07)] px-4 py-3.5"
        >
          <span className="text-[13px] font-semibold text-[var(--moss)]">
            Recommended mix: {recipe}
          </span>
          <ArrowRight size={15} className="text-[var(--leaf)]" />
        </Link>
      ) : null}
    </div>
  );
}

function NutrientPanel({ product }: { product: Product }) {
  if (!product.npk) return null;
  return (
    <div className="rounded-[24px] bg-[var(--moss-deep)] p-6 text-white">
      <p className="eyebrow text-[var(--lime)]">Analysis</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { k: "N", v: product.npk.n, full: "Nitrogen" },
          { k: "P", v: product.npk.p, full: "Phosphorus" },
          { k: "K", v: product.npk.k, full: "Potassium" },
        ].map((m) => (
          <div key={m.k} className="rounded-2xl border border-white/12 bg-white/5 p-4 text-center">
            <p className="display text-[34px] leading-none text-[var(--lime)] tabular-nums">
              {m.v}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/45">
              {m.k} · {m.full}
            </p>
          </div>
        ))}
      </div>
      {product.npk.extras ? (
        <p className="mt-4 text-[12.5px] text-white/55">Also contains {product.npk.extras}</p>
      ) : null}

      {product.dose && !product.oneOff ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/45">
            Dose per litre
          </p>
          <dl className="mt-3 space-y-2 text-[13px]">
            {[
              ["Seedling", product.dose.seedling],
              ["Growing", product.dose.veg],
              ["Flowering", product.dose.bloom],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-white/60">{label}</dt>
                <dd className="font-bold tabular-nums">{value} g / L</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/shop/mix"
            className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--lime)]"
          >
            Work out grams per can <ArrowRight size={13} />
          </Link>
        </div>
      ) : null}

      {product.oneOff ? (
        <p className="mt-6 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-white/60">
          Applied once, at potting: dust 1 g onto bare roots, or 5 g per 10 L of mix. Not a weekly
          feed — it is the plumbing that makes the weekly feed work.
        </p>
      ) : null}
    </div>
  );
}

function AmendmentPanel({ product }: { product: Product }) {
  if (!product.amendment || !product.metrics) return null;
  const used = RECIPES.filter((r) => (r.mix[product.slug] ?? 0) > 0);
  return (
    <div className="rounded-[24px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
      <p className="eyebrow text-[rgba(13,22,16,.4)]">Role in a mix</p>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.62)]">
        {product.amendment.role}
      </p>

      <div className="mt-6 space-y-3">
        {Object.entries(product.metrics).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold capitalize text-[rgba(13,22,16,.65)]">{key}</span>
              <span className="tabular-nums text-[rgba(13,22,16,.45)]">
                {Math.round(value * 100)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(28,58,41,.1)]">
              <div
                className="h-full rounded-full bg-[var(--leaf)]"
                style={{ width: `${value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[rgba(28,58,41,.1)] pt-5 text-[12.5px]">
        <div>
          <dt className="text-[rgba(13,22,16,.45)]">pH</dt>
          <dd className="display text-[19px]">{product.amendment.ph.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-[rgba(13,22,16,.45)]">Typical rate</dt>
          <dd className="text-[13px] font-semibold">{product.amendment.rate}</dd>
        </div>
      </dl>

      {used.length ? (
        <p className="mt-5 text-[12px] text-[rgba(13,22,16,.5)]">
          Used in: <span className="font-semibold">{used.map((r) => r.name).join(", ")}</span>
        </p>
      ) : null}
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const cat = CATEGORIES[product.category];
  const pairings = pairingsFor(slug).slice(0, 3);
  const more = PRODUCTS.filter((p) => p.category === product.category && p.slug !== slug).slice(0, 3);
  const reviews = REVIEW_COPY[product.category] ?? REVIEW_COPY.plants;

  return (
    <>
      <MarkViewed slug={slug} />

      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-24 md:px-8 md:pt-32">
        <nav className="mb-8 flex items-center gap-2 text-[12px] text-[rgba(13,22,16,.45)]">
          <Link href="/shop" className="hover:text-[var(--ink)]">
            Hlaza
          </Link>
          <ChevronRight size={12} />
          <Link href={`/shop/${product.category}`} className="hover:text-[var(--ink)]">
            {cat.label}
          </Link>
          <ChevronRight size={12} />
          <span className="text-[var(--ink)]">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <ProductGallery product={product} />

          <div>
            <p className="eyebrow" style={{ color: cat.accent }}>
              {cat.eyebrow}
            </p>
            <h1 className="display mt-3 text-[clamp(2.2rem,5.4vw,3.6rem)]">{product.name}</h1>
            {product.latin ? (
              <p className="mt-2 text-[14px] italic text-[rgba(13,22,16,.5)]">{product.latin}</p>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      i < Math.round(product.rating)
                        ? "fill-[var(--clay)] text-[var(--clay)]"
                        : "text-[rgba(13,22,16,.16)]"
                    }
                  />
                ))}
              </span>
              <span className="text-[12.5px] text-[rgba(13,22,16,.55)]">
                {product.rating.toFixed(1)} · {product.reviews} reviews
              </span>
            </div>

            <p className="mt-6 text-[16px] font-medium leading-relaxed text-[var(--ink)]">
              {product.tagline}
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-[rgba(13,22,16,.62)]">
              {product.story}
            </p>

            <ul className="mt-7 space-y-2.5">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-[13.5px] text-[rgba(13,22,16,.7)]">
                  <Check size={15} className="mt-0.5 shrink-0 text-[var(--leaf)]" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <ProductPurchase product={product} />
            </div>
          </div>
        </div>

        {/* dossier + category panel */}
        <div className="mt-16 grid gap-5 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div>
            <p className="eyebrow text-[rgba(13,22,16,.4)]">Specimen dossier</p>
            <dl className="mt-5 divide-y divide-[rgba(28,58,41,.1)] rounded-[24px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)]">
              {product.specs.map((s) => (
                <div key={s.label} className="flex items-start justify-between gap-6 px-6 py-4">
                  <dt className="text-[13px] text-[rgba(13,22,16,.5)]">{s.label}</dt>
                  <dd className="max-w-[58%] text-right text-[13.5px] font-semibold">{s.value}</dd>
                </div>
              ))}
              <div className="flex items-start justify-between gap-6 px-6 py-4">
                <dt className="text-[13px] text-[rgba(13,22,16,.5)]">Price</dt>
                <dd className="text-[13.5px] font-semibold">{money(product.price)} incl. VAT</dd>
              </div>
            </dl>

            <div className="mt-8 rounded-[24px] border border-dashed border-[rgba(28,58,41,.22)] p-6">
              <p className="flex items-center gap-2 text-[13px] font-bold text-[var(--moss)]">
                <Truck size={15} /> Delivery
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[rgba(13,22,16,.6)]">
                {product.category === "plants"
                  ? "Plants travel in a dedicated plant lane: boxed standing up, roots wrapped, dispatched Monday to Wednesday so nothing sits in a depot over a weekend."
                  : "Powders and amendments leave the greenhouse within 24 hours in a compostable mailer."}{" "}
                Free over R750, otherwise R89
                {product.category === "plants" ? " plus a R60 plant-lane fee" : ""}.
              </p>
            </div>
          </div>

          <div>
            {product.category === "plants" ? <CarePanel product={product} /> : null}
            {product.category === "nutrients" ? <NutrientPanel product={product} /> : null}
            {product.category === "substrate" ? <AmendmentPanel product={product} /> : null}

            {pairings.length ? (
              <div className="mt-5 rounded-[24px] border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Goes with</p>
                <ul className="mt-4 space-y-3">
                  {pairings.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/shop/product/${p.slug}`}
                        className="group flex items-center gap-3.5"
                      >
                        <span
                          className="h-10 w-10 shrink-0 rounded-xl"
                          style={{
                            background: `linear-gradient(140deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold group-hover:text-[var(--leaf)]">
                            {p.name}
                          </span>
                          <span className="block text-[11.5px] text-[rgba(13,22,16,.45)]">
                            {p.size}
                          </span>
                        </span>
                        <span className="display shrink-0 text-[15px]">{money(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* reviews */}
      <section className="border-y border-[rgba(28,58,41,.1)] bg-[var(--paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[rgba(13,22,16,.4)]">Reviews</p>
                <h2 className="display mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">
                  {product.rating.toFixed(1)} out of 5 · {product.reviews} reviews
                </h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {reviews.map((text, i) => {
              const [who, where] = REVIEWERS[(product.slug.length + i) % REVIEWERS.length];
              return (
                <Reveal key={text} delay={i * 0.08}>
                  <figure className="flex h-full flex-col justify-between rounded-2xl bg-[var(--bone)] p-6">
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, d) => (
                        <Star key={d} size={11} className="fill-[var(--clay)] text-[var(--clay)]" />
                      ))}
                    </span>
                    <blockquote className="mt-4 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.68)]">
                      “{text}”
                    </blockquote>
                    <figcaption className="mt-5 text-[11.5px] font-bold uppercase tracking-[.14em] text-[rgba(13,22,16,.4)]">
                      {who} · {where}
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* more from the room */}
      {more.length ? (
        <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display text-[clamp(1.7rem,3.4vw,2.4rem)]">
                More from {cat.label.toLowerCase()}
              </h2>
              <Link
                href={`/shop/${product.category}`}
                className="group text-[13.5px] font-bold text-[var(--leaf)]"
              >
                View all{" "}
                <ArrowRight
                  size={14}
                  className="inline transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
