import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/shop/CheckoutFlow";

export const metadata: Metadata = {
  title: "Checkout | Hlaza",
  description: "Secure checkout for plants, powders and amendments.",
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
