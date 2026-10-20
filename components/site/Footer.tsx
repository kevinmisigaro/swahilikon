import Link from "next/link";
import { DEMO_HOMEPAGE_ONLY } from "@/lib/demoMode";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/events", label: "Events" },
      { href: "/explore", label: "Creators & Competitions" },
      { href: "/fanzone", label: "FanZone" },
      { href: "/past-events", label: "Past Events" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/referral", label: "Referral Code" },
      { href: "/my-skc", label: "My SKC / Fan Pass" },
      { href: "/masterclasses", label: "Masterclasses" },
      { href: "/competitions", label: "Competitions" },
    ],
  },
];

// Separate domain/deployment from the public site, so this is a plain link.
// Only render it when the env var is actually configured — otherwise a
// production build would silently link to localhost.
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL;

export function Footer() {
  return (
    <footer className="halftone-red mt-20 border-t-4 border-comic-black bg-comic-black text-warm-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl">Swahili Komik Con</p>
            <p className="mt-3 max-w-xs text-sm text-warm-white/80">
              Your World of Comics, Gaming, Animation &amp; Cosplay.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-display text-lg tracking-wide text-golden-orange">
                {col.title}
              </p>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {DEMO_HOMEPAGE_ONLY ? (
                      <span className="cursor-not-allowed text-warm-white/40" aria-disabled="true">
                        {link.label}
                      </span>
                    ) : (
                      <Link href={link.href} className="text-warm-white/85 hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {ADMIN_URL && !DEMO_HOMEPAGE_ONLY && (
            <div>
              <p className="mb-3 font-display text-lg tracking-wide text-golden-orange">Staff</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={ADMIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-warm-white/85 hover:text-white"
                  >
                    Admin login
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-warm-white/60">
          © 2026 Tai Plus Co. Limited. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
