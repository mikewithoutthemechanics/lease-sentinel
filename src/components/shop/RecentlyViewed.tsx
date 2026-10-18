"use client";

import Link from "next/link";
import { getProduct } from "@/lib/shop/catalogue";
import { money } from "@/lib/shop/format";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";

export function RecentlyViewed() {
  const { viewed } = useCart();
  const items = viewed.map((slug) => getProduct(slug)).filter((p) => Boolean(p)).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="border-t border-[rgba(28,58,41,.1)] bg-[var(--paper)]">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
        <p className="eyebrow text-[rgba(13,22,16,.4)]">Picked up where you left off</p>
        <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
          {items.map((p) => (
            <Link
              key={p!.slug}
              href={`/shop/product/${p!.slug}`}
              className="group w-[150px] shrink-0"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-[rgba(28,58,41,.1)]">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  <ProductImage product={p!} sizes="150px" swatchLabel={false} />
                </div>
              </div>
              <p className="mt-2.5 truncate text-[13px] font-semibold">{p!.name}</p>
              <p className="text-[12px] text-[rgba(13,22,16,.5)]">{money(p!.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
