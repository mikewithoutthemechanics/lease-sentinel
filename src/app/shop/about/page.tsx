import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/shop/Reveal";
import { DELIVERY, money } from "@/lib/shop/format";

export const metadata: Metadata = {
  title: "The greenhouse | Hlaza",
  description:
    "How Hlaza grows, mills and ships plants, powders and substrate amendments from KwaZulu-Natal.",
};

const FACTS = [
  { k: "01", t: "Grown, not bought in", d: "Everything with roots comes off our own benches in KwaDukuza. We do not re-wholesale imported stock." },
  { k: "02", t: "Milled monthly", d: "Nutrient powders are blended in small batches so nothing sits long enough to cake in the tin." },
  { k: "03", t: "Peat-free, always", d: "Our base is coir and compost. We have never sold a bag of peat and we are not going to start." },
  { k: "04", t: "Packed the morning of", d: "Plants are boxed the morning they are collected. Nothing spends a night sealed in cardboard." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[var(--moss-deep)]" />
        <div
          className="absolute right-0 top-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #33684c, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-28 md:px-8 md:pt-36">
          <Reveal>
            <p className="eyebrow text-[var(--lime)]">The greenhouse</p>
            <h1 className="display mt-4 max-w-[18ch] text-[clamp(2.4rem,6.4vw,4.6rem)] text-white">
              A plant shop that sells the parts, not the promise.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/65">
              Hlaza started because buying a beautiful plant is easy and keeping one alive is not.
              We sell the plant, the powder that feeds it and the medium it stands in — separately,
              with the numbers on the tin.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal key={f.k} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-[rgba(28,58,41,.12)] bg-[var(--paper)] p-6">
                <span className="display text-[13px] text-[var(--clay)]">{f.k}</span>
                <h3 className="display mt-3 text-[20px] leading-tight">{f.t}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[rgba(13,22,16,.6)]">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="shipping" className="mx-auto mt-24 max-w-[1400px] scroll-mt-24 px-5 md:px-8">
        <div className="grid gap-10 rounded-[30px] bg-[var(--moss-deep)] p-7 text-white md:p-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="eyebrow text-[var(--lime)]">Shipping</p>
              <h2 className="display mt-3 text-[clamp(1.9rem,4vw,3rem)] text-white">
                Plant post, and everything else.
              </h2>
              <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-white/65">
                Plants travel standing up in a box built for it, roots wrapped, dispatched Monday to
                Wednesday so nobody sits in a depot over a weekend. Powders and amendments go out
                within 24 hours in a compostable mailer.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <dl className="divide-y divide-white/10">
              {[
                ["Standard delivery", `${DELIVERY.leadTime} · ${money(DELIVERY.standard)}`],
                ["Express", `Next working day · ${money(DELIVERY.express)}`],
                ["Plant lane surcharge", `${money(DELIVERY.plantSurcharge)} per order with plants`],
                ["Free delivery", `On orders over ${money(DELIVERY.freeOver)}`],
                ["Provinces covered", `${DELIVERY.regions.length} — all of them`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-6 py-4">
                  <dt className="text-[13.5px] text-white/60">{k}</dt>
                  <dd className="text-right text-[13.5px] font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="guarantee" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow text-[var(--clay)]">The 14-day promise</p>
            <h2 className="display mt-3 text-[clamp(1.9rem,4vw,3rem)]">
              If it lands badly, we replace it.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[rgba(13,22,16,.62)]">
              Send us a photograph within fourteen days of delivery. If the plant is not in the
              condition we said it would be, we send another one — no returns, no interrogation. If
              it dies in month four because your corner turned out darker than you thought, message
              us anyway; we would rather talk you through it than sell you a replacement you do not
              need.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop/plants"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--moss)] px-6 text-[14px] font-bold text-[var(--bone)] hover:bg-[var(--leaf)]"
              >
                Shop living things
              </Link>
              <Link
                href="/shop/finder"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(28,58,41,.2)] px-6 text-[14px] font-bold text-[var(--moss)] hover:bg-[rgba(28,58,41,.05)]"
              >
                Not sure? Use the finder
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
