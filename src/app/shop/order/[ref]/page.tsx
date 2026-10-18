import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/shop/OrderConfirmation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Order ${ref} | Hlaza`,
    description: "Your Hlaza order is confirmed.",
  };
}

export default async function OrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return <OrderConfirmation reference={ref} />;
}
