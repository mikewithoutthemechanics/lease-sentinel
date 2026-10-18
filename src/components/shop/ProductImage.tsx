import Image from "next/image";
import type { Product } from "@/lib/shop/types";

/**
 * Product photography, or — for items still waiting on a shoot — a procedural
 * material swatch built from the product's own two-stop palette. The swatch is
 * designed to look deliberate rather than broken.
 */
export function ProductImage({
  product,
  sizes = "(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 460px",
  priority = false,
  className = "",
  swatchLabel = true,
}: {
  product: Product;
  sizes?: string;
  priority?: boolean;
  className?: string;
  swatchLabel?: boolean;
}) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={`${product.name}${product.latin ? ` — ${product.latin}` : ""}`}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  const [from, to] = product.swatch;
  const initials = product.name
    .split(" ")
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(148deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={`${product.name} material swatch`}
    >
      {/* mineral speckle */}
      <svg className="absolute inset-0 h-full w-full opacity-70" aria-hidden>
        <filter id={`speckle-${product.slug}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={product.category === "substrate" ? "0.9" : "0.62"}
            numOctaves="4"
            seed={product.slug.length * 7}
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={product.category === "substrate" ? 0.55 : 0.34} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#speckle-${product.slug})`} />
      </svg>
      {/* soft top light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 22% 8%, rgba(255,255,255,.38), transparent 55%), linear-gradient(to top, rgba(13,22,16,.42), transparent 62%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-white/95">
        <span className="display text-[clamp(3.4rem,16vw,7rem)] leading-none drop-shadow-[0_8px_28px_rgba(13,22,16,.45)]">
          {initials}
        </span>
        {swatchLabel && (
          <span className="eyebrow text-[9px] text-white/70">Material specimen</span>
        )}
      </div>
    </div>
  );
}
