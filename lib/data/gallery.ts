// Curated, web-optimized photos from the 2 August 2026 event.
// Source: SWAHILI KOMIKCON photo drop — resized to a 1600px max edge for web delivery.
export const SKC_AUG_2026_GALLERY = Array.from({ length: 30 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return `/images/gallery/skc-2026-08-${num}.jpg`;
});
