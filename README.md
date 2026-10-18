This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

---

## Hlaza — Living Supply Co. (`/shop`)

A second product lives in this repository: **Hlaza**, an immersive storefront for pot plants,
powdered nutrients and substrate amendments. It is South-African-specific (ZAR pricing, Payfast
checkout copy, plant-lane courier rules, all nine provinces) and runs entirely client-side — no
database or session required.

```bash
npm run dev
# then open http://localhost:3000/shop
```

### Routes

| Route | What it is |
| --- | --- |
| `/shop` | Landing: parallax hero, the three rooms, bestsellers, the scroll-driven ritual sequence |
| `/shop/plants` | Living things — filtered by light, difficulty and watering rhythm |
| `/shop/nutrients` | Water-soluble powders — filtered by NPK role |
| `/shop/substrate` | The soil bar — filtered by which of the five axes an amendment moves |
| `/shop/collections` | Everything, filtered and sorted |
| `/shop/product/[slug]` | Product detail: zoomable gallery, dossier, category-specific panel, pairings |
| `/shop/mix` | **The Mix Lab** — build a substrate recipe and a feeding schedule, then buy the exact litres and grams |
| `/shop/finder` | Plant finder — a four-question quiz that scores the catalogue and returns a matched kit |
| `/shop/cart` · `/shop/checkout` · `/shop/order/[ref]` | Bag, three-step checkout, confirmation |
| `/shop/about` | The greenhouse, shipping and the 14-day promise |

### How it is put together

- **Catalogue** — `src/lib/shop/catalogue.ts` holds all fifteen lines as typed data
  (`src/lib/shop/types.ts`). Products carry category-specific fields: `care` for plants,
  `npk` / `dose` / `grams` for nutrients, and `amendment` / `metrics` for substrate.
- **Cart** — `src/components/shop/CartProvider.tsx`. `useReducer` + `localStorage`, with lines
  keyed by slug *and* recipe *and* variant so a Mix Lab recipe and a hand-picked bag of the same
  product never collide. Hydration is deferred until after mount so server and client markup match.
- **Motion** — Framer Motion throughout: parallax hero, scroll-driven horizontal ritual sequence,
  layout-animated grids, spring-physics cart drawer, word-by-word headline reveals. Every animated
  component respects `useReducedMotion()`.
- **Imagery** — `public/shop/…` (WebP). Products without a photograph fall back to a procedural
  material swatch built from the product's own two-stop palette, so the grid never looks broken.
- **Styling** — the shop ships its own visual language in `src/app/shop/shop.css` (palette,
  grain, marquee, range sliders) and is deliberately independent of the Lease Sentinel UI.

### Notes

- Checkout is a demonstration flow: card fields are inert, no payment provider is called.
- `/shop` is exempted from the Supabase session middleware in `src/middleware.ts` because the
  storefront is public.
- Product photography currently covers the plants and four of the five nutrients; the remaining
  six lines (kelp extract and the substrate range) render their material swatch until they are shot.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
