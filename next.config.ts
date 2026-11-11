import type { NextConfig } from "next";

// Member-uploaded comic pages are served as signed URLs from Supabase
// Storage, which next/image needs to allow explicitly.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (PPR-style static shells) would require every
  // Supabase/cookie-backed read in this app to be wrapped in <Suspense> or
  // explicitly opted out per-route. This site is pull-to-date by nature
  // (live referral codes, live auth), so plain request-time rendering is
  // the better default here.
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
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
