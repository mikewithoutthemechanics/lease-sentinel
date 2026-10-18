import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Your bag | Hlaza",
  description: "Review your plants, powders and amendments before checkout.",
};

export default function CartPage() {
  return <CartView />;
}
