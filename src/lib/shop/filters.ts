import type { MixMetrics, Product } from "./types";

const METRIC_LABEL: Record<keyof MixMetrics, string> = {
  drainage: "Drainage",
  aeration: "Aeration",
  moisture: "Moisture",
  nutrition: "Nutrition",
  biology: "Biology",
};

/** Derives the filter chips shown above each collection. */
export function tagsFor(product: Product): string[] {
  const tags = [...(product.badges ?? [])];

  if (product.category === "plants" && product.care) {
    const { light, difficulty, water } = product.care;
    if (light <= 2) tags.push("Low light");
    if (light >= 4) tags.push("Bright light");
    if (difficulty <= 2) tags.push("Beginner");
    if (difficulty >= 4) tags.push("Experienced");
    if (water <= 2) tags.push("Dry between");
  }

  if (product.category === "nutrients") {
    if (product.npk) {
      if (product.npk.n >= 15) tags.push("Growth");
      if (product.npk.p >= 20) tags.push("Flowering");
      if (product.npk.k >= 15) tags.push("Potassium");
      if (product.npk.n === 0 && product.npk.p === 0) tags.push("Supplement");
    }
    if (product.oneOff) tags.push("At potting");
  }

  if (product.category === "substrate" && product.metrics) {
    const ranked = (Object.entries(product.metrics) as [keyof MixMetrics, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    for (const [key, value] of ranked) {
      if (value >= 0.6) tags.push(METRIC_LABEL[key]);
    }
  }

  return Array.from(new Set(tags));
}

export function allTags(products: Product[]): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const t of tagsFor(p)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
}

export type Sort = "featured" | "price-asc" | "price-desc" | "rating";

export function applyFilters(products: Product[], tags: string[], sort: Sort): Product[] {
  const filtered = tags.length
    ? products.filter((p) => {
        const own = tagsFor(p);
        return tags.every((t) => own.includes(t));
      })
    : products;

  const sorted = [...filtered];
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      break;
    default:
      sorted.sort((a, b) => b.reviews - a.reviews);
  }
  return sorted;
}
