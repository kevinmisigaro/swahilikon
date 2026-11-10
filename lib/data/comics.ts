// Web comics readable on the site. Pages are static JPEGs in
// public/comics/<slug>/page-NNN.jpg, rendered from the creator's PDF at a
// 1400px width. To add a comic: drop its pages in a new folder and add an
// entry below — the listing, reader and nav pick it up automatically.

export interface Comic {
  slug: string;
  title: string;
  subtitle?: string;
  creator: string;
  partners?: string[];
  language: string;
  description: string;
  /** Shown before reading when the story covers difficult themes. */
  contentNote?: string;
  /** Intrinsic size of every page image, used for layout without shift. */
  pageWidth: number;
  pageHeight: number;
  pages: string[];
}

function pagePaths(slug: string, count: number) {
  return Array.from(
    { length: count },
    (_, i) => `/comics/${slug}/page-${String(i + 1).padStart(3, "0")}.jpg`,
  );
}

export const COMICS: Comic[] = [
  {
    slug: "bonde",
    title: "Bonde",
    subtitle: "Harakati za Ngeti",
    creator: "Tai Studio",
    partners: ["UNFPA", "United Nations Tanzania"],
    language: "Kiswahili",
    description:
      "In the village of Imani lives Magde — gentle, orderly and bright in class, but carrying deep sorrow. Made for adolescents, Bonde follows her story to help young readers understand the harm of gender-based violence and child marriage, and how to protect themselves.",
    contentNote: "This story deals with gender-based violence and child marriage.",
    pageWidth: 1400,
    pageHeight: 1986,
    pages: pagePaths("bonde", 20),
  },
  {
    slug: "heri",
    title: "Heri",
    subtitle: "Mbabe wa Magonjwa",
    creator: "Tai Plus",
    partners: ["ADD International"],
    language: "Kiswahili",
    description:
      "Heri, a young superhero with the power to fight disease, takes on the germs hiding in Maha, the world of dangerous diseases. Made for children to learn how illnesses spread and how to protect themselves and stay safe.",
    pageWidth: 1400,
    pageHeight: 1921,
    pages: pagePaths("heri", 47),
  },
  {
    slug: "mashujaa-wa-uviko-19",
    title: "Mashujaa wa UVIKO-19",
    subtitle: "Heroes of COVID-19",
    creator: "Tai Plus",
    partners: ["Wizara ya Afya", "USAID", "CDC", "WRAIR", "Peace Corps"],
    language: "Kiswahili",
    description:
      "The true-life story of ten Tanzanian doctors and nurses who faced the COVID-19 pandemic head-on and without fear. A tribute to the courage, unity and persistence of health workers on the front line of science and health.",
    pageWidth: 1400,
    pageHeight: 1986,
    pages: pagePaths("mashujaa-wa-uviko-19", 36),
  },
];

export function getComicBySlug(slug: string) {
  return COMICS.find((comic) => comic.slug === slug);
}
