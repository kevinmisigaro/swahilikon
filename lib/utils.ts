import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatEventDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dar_es_Salaam",
  });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatMoney(cents: number | null | undefined, currency: string | null | undefined) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "TZS",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}
