/** ZAR formatter that stays compact: R 649 / R 189.50 */
export function money(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return `R ${rounded.toLocaleString("en-ZA")}`;
  return `R ${rounded.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function grams(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 2)} kg`;
  if (value < 1) return `${(value * 1000).toFixed(0)} mg`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} g`;
}

export function slugToName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const DELIVERY = {
  /** Free delivery threshold in ZAR */
  freeOver: 750,
  standard: 89,
  /** Plants travel in a dedicated courier lane. */
  plantSurcharge: 60,
  express: 145,
  leadTime: "2–4 working days",
  regions: [
    "Gauteng",
    "KwaZulu-Natal",
    "Western Cape",
    "Eastern Cape",
    "Free State",
    "Mpumalanga",
    "Limpopo",
    "North West",
    "Northern Cape",
  ],
};

export function deliveryFor(subtotal: number, hasPlants: boolean): number {
  if (subtotal >= DELIVERY.freeOver) return hasPlants ? DELIVERY.plantSurcharge : 0;
  return DELIVERY.standard + (hasPlants ? DELIVERY.plantSurcharge : 0);
}
