"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getProduct } from "@/lib/shop/catalogue";
import { DELIVERY, deliveryFor } from "@/lib/shop/format";
import type { CartLine, Product } from "@/lib/shop/types";

const STORAGE_KEY = "hlaza.cart.v1";
const VIEWED_KEY = "hlaza.viewed.v1";
const FREE_DELIVERY_OVER = DELIVERY.freeOver;

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type State = { lines: CartLine[]; viewed: string[] };

type Action =
  | { type: "hydrate"; lines: CartLine[]; viewed: string[] }
  | {
      type: "add";
      slug: string;
      qty: number;
      recipe?: string;
      variant?: string;
      unitPrice?: number;
    }
  | { type: "setQty"; slug: string; qty: number; recipe?: string; variant?: string }
  | { type: "remove"; slug: string; recipe?: string; variant?: string }
  | { type: "viewed"; slug: string }
  | { type: "clear" };

const sameLine = (a: CartLine, slug: string, recipe?: string, variant?: string) =>
  a.slug === slug &&
  (a.recipe ?? "") === (recipe ?? "") &&
  (a.variant ?? "") === (variant ?? "");

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, viewed: action.viewed };

    case "add": {
      const existing = state.lines.find((l) =>
        sameLine(l, action.slug, action.recipe, action.variant),
      );
      const next = existing
        ? state.lines.map((l) =>
            sameLine(l, action.slug, action.recipe, action.variant)
              ? { ...l, qty: Math.min(99, l.qty + action.qty) }
              : l,
          )
        : [
            ...state.lines,
            {
              slug: action.slug,
              qty: action.qty,
              recipe: action.recipe,
              variant: action.variant,
              unitPrice: action.unitPrice,
            },
          ];
      return { ...state, lines: next };
    }

    case "setQty": {
      if (action.qty <= 0)
        return {
          ...state,
          lines: state.lines.filter(
            (l) => !sameLine(l, action.slug, action.recipe, action.variant),
          ),
        };
      return {
        ...state,
        lines: state.lines.map((l) =>
          sameLine(l, action.slug, action.recipe, action.variant)
            ? { ...l, qty: Math.min(99, action.qty) }
            : l,
        ),
      };
    }

    case "remove":
      return {
        ...state,
        lines: state.lines.filter(
          (l) => !sameLine(l, action.slug, action.recipe, action.variant),
        ),
      };

    case "viewed":
      return {
        ...state,
        viewed: [action.slug, ...state.viewed.filter((s) => s !== action.slug)].slice(0, 8),
      };

    case "clear":
      return { ...state, lines: [] };
  }
}

type DetailedLine = CartLine & { product: Product; unit: number; lineTotal: number };

type CartApi = {
  lines: DetailedLine[];
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  hasPlants: boolean;
  freeDeliveryGap: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (
    slug: string,
    qty?: number,
    recipe?: string,
    variant?: string,
    unitPrice?: number,
  ) => void;
  setQty: (slug: string, qty: number, recipe?: string, variant?: string) => void;
  remove: (slug: string, recipe?: string, variant?: string) => void;
  clear: () => void;
  /** Bumps on every add so the header badge can react. */
  pulse: number;
  lastAdded: string | null;
  viewed: string[];
  markViewed: (slug: string) => void;
  hydrated: boolean;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], viewed: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  // Flips to true after hydration without a render-triggering effect.
  const hydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const first = useRef(true);

  // Read the persisted bag once, after mount, so server and client markup match.
  useEffect(() => {
    let lines: CartLine[] = [];
    let viewed: string[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          lines = parsed.filter((l) => l && typeof l.slug === "string" && getProduct(l.slug));
        }
      }
      const rawViewed = window.localStorage.getItem(VIEWED_KEY);
      if (rawViewed) {
        const parsed = JSON.parse(rawViewed) as string[];
        if (Array.isArray(parsed)) viewed = parsed.filter((s) => getProduct(s)).slice(0, 8);
      }
    } catch {
      /* private mode — start empty */
    }
    dispatch({ type: "hydrate", lines, viewed });
  }, []);

  // persist lines
  useEffect(() => {
    if (!hydrated) return;
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* ignore */
    }
  }, [state.lines, hydrated]);

  // persist recently viewed
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(VIEWED_KEY, JSON.stringify(state.viewed));
    } catch {
      /* ignore */
    }
  }, [state.viewed, hydrated]);

  const add = useCallback(
    (slug: string, qty = 1, recipe?: string, variant?: string, unitPrice?: number) => {
      dispatch({ type: "add", slug, qty, recipe, variant, unitPrice });
      setLastAdded(slug);
      setPulse((p) => p + 1);
      setIsOpen(true);
    },
    [],
  );

  const setQty = useCallback((slug: string, qty: number, recipe?: string, variant?: string) => {
    dispatch({ type: "setQty", slug, qty, recipe, variant });
  }, []);

  const remove = useCallback((slug: string, recipe?: string, variant?: string) => {
    dispatch({ type: "remove", slug, recipe, variant });
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const markViewed = useCallback((slug: string) => dispatch({ type: "viewed", slug }), []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartApi>(() => {
    const lines: DetailedLine[] = state.lines
      .map((line) => {
        const product = getProduct(line.slug);
        if (!product) return null;
        const unit = line.unitPrice ?? product.price;
        return { ...line, product, unit, lineTotal: unit * line.qty };
      })
      .filter((l): l is DetailedLine => Boolean(l));

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const hasPlants = lines.some((l) => l.product.category === "plants");
    const delivery = subtotal > 0 ? deliveryFor(subtotal, hasPlants) : 0;

    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      delivery,
      total: subtotal + delivery,
      hasPlants,
      freeDeliveryGap: Math.max(0, FREE_DELIVERY_OVER - subtotal),
      isOpen,
      openCart,
      closeCart,
      add,
      setQty,
      remove,
      clear,
      pulse,
      lastAdded,
      viewed: state.viewed,
      markViewed,
      hydrated,
    };
  }, [
    state.lines,
    state.viewed,
    isOpen,
    openCart,
    closeCart,
    add,
    setQty,
    remove,
    clear,
    pulse,
    lastAdded,
    markViewed,
    hydrated,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
