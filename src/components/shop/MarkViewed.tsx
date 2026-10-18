"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function MarkViewed({ slug }: { slug: string }) {
  const { markViewed } = useCart();
  useEffect(() => {
    markViewed(slug);
  }, [slug, markViewed]);
  return null;
}
