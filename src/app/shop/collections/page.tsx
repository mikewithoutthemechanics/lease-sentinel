import type { Metadata } from "next";
import { CollectionShell } from "@/components/shop/CollectionShell";
import { PRODUCTS } from "@/lib/shop/catalogue";

export const metadata: Metadata = {
  title: "Everything | Hlaza",
  description: "The full Hlaza catalogue: pot plants, powdered nutrients and substrate amendments.",
};

export default function CollectionsPage() {
  return (
    <CollectionShell
      eyebrow="The whole shelf"
      title="Everything"
      blurb="Fifteen lines, three rooms, one box. Filter across the lot or jump straight to the Mix Lab and let the recipe choose for you."
      accent="#33684c"
      products={PRODUCTS}
    />
  );
}
