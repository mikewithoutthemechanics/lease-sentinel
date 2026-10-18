import type { Metadata } from "next";
import { CartProvider } from "@/components/shop/CartProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { ShopFooter } from "@/components/shop/Footer";
import { ShopHeader } from "@/components/shop/Header";
import "./shop.css";

export const metadata: Metadata = {
  title: "Hlaza — Living Supply Co. | Pot plants, powdered nutrients & substrate",
  description:
    "Pot plants, water-soluble nutrient powders and substrate amendments. Build a mix in the Mix Lab, match a plant in the finder, and have it all shipped from KwaZulu-Natal.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="shop grain relative min-h-screen overflow-x-clip">
        <ShopHeader />
        <main>{children}</main>
        <ShopFooter />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
