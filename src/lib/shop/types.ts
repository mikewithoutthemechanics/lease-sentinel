export type Category = "plants" | "nutrients" | "substrate";

export type CareProfile = {
  /** 1 = low, 5 = high */
  light: number;
  water: number;
  difficulty: number;
  humidity: number;
};

export type Npk = {
  n: number;
  p: number;
  k: number;
  extras?: string;
};

/** Grams of powder per litre of water, by growth stage. */
export type Dose = {
  seedling: number;
  veg: number;
  bloom: number;
};

export type Amendment = {
  /** One line on what this amendment does in a mix. */
  role: string;
  ph: number;
  /** Litres (or litres-equivalent) supplied per pack/bag. */
  litres: number;
  /** Human application rate, e.g. "10–20 % of total volume". */
  rate: string;
  /** Textural description of the grain. */
  grain: string;
};

/** How a substrate amendment shifts a mix, 0–1. */
export type MixMetrics = {
  drainage: number;
  aeration: number;
  moisture: number;
  nutrition: number;
  biology: number;
};

export type Product = {
  slug: string;
  name: string;
  latin?: string;
  category: Category;
  /** ZAR */
  price: number;
  compareAt?: number;
  size: string;
  image?: string;
  /** Two-stop gradient used for the procedural material swatch. */
  swatch: [string, string];
  tagline: string;
  story: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  badges?: string[];
  rating: number;
  reviews: number;
  stock: number;
  petSafe?: boolean;
  care?: CareProfile;
  npk?: Npk;
  dose?: Dose;
  /** Grams of powder in the pack, used by the feeding calculator. */
  grams?: number;
  /** True for things applied once at potting rather than on a weekly rhythm. */
  oneOff?: boolean;
  solubility?: string;
  amendment?: Amendment;
  metrics?: MixMetrics;
  pairings: string[];
};

export type CartLine = {
  slug: string;
  qty: number;
  /** Set when the line came from the Mix Lab so it can be grouped in the drawer. */
  recipe?: string;
  /** Chosen size/pot option, when the product has variants. */
  variant?: string;
  /** Overrides the catalogue price for a given variant. */
  unitPrice?: number;
};

export type Recipe = {
  name: string;
  note: string;
  /** slug -> parts (normalised to percentages at render time) */
  mix: Record<string, number>;
};
