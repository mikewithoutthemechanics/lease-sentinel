import type { Product } from "./types";

export type Variant = {
  label: string;
  note: string;
  price: number;
};

const round5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Size / pot options. Kept category-generic so the catalogue does not need to
 * carry a variant table for every line.
 */
export function variantsFor(product: Product): Variant[] {
  if (product.category === "plants") {
    return [
      { label: "Nursery pot", note: "As grown — free", price: product.price },
      {
        label: "With terracotta",
        note: "Hand-thrown, 2 cm up",
        price: round5(product.price + 180),
      },
      {
        label: "With stoneware",
        note: "Matte charcoal, glazed",
        price: round5(product.price + 265),
      },
    ];
  }

  if (product.category === "nutrients") {
    const grams = product.grams ?? 500;
    const big = grams * 2;
    const bigLabel = big >= 1000 ? `${big / 1000} kg tin` : `${big} g tin`;
    return [
      {
        label: `${Math.round(grams * 0.5)} g tin`,
        note: "Try it",
        price: round5(product.price * 0.6),
      },
      { label: `${grams} g tin`, note: "Standard", price: product.price },
      { label: bigLabel, note: "Best value per gram", price: round5(product.price * 1.75) },
    ];
  }

  const litres = product.amendment?.litres ?? 5;
  return [
    {
      label: `Starter · ${Math.round(litres * 0.5)} L`,
      note: "One or two pots",
      price: round5(product.price * 0.6),
    },
    {
      label: `Standard · ${litres} L`,
      note: product.size,
      price: product.price,
    },
    {
      label: `Bulk · ${Math.round(litres * 2.4)} L`,
      note: "Repotting season",
      price: round5(product.price * 2.1),
    },
  ];
}
