import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (PPR-style static shells) would require every
  // Supabase/cookie-backed read in this app to be wrapped in <Suspense> or
  // explicitly opted out per-route. This site is pull-to-date by nature
  // (live referral codes, live auth), so plain request-time rendering is
  // the better default here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
