"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_HOMEPAGE_ONLY } from "@/lib/demoMode";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/explore", label: "Explore" },
  { href: "/past-events", label: "Past Events" },
  { href: "/referral", label: "Referral Code" },
  { href: "/my-skc", label: "My SKC" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function isLocked(href: string) {
    return DEMO_HOMEPAGE_ONLY && href !== "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b-4 border-comic-black bg-warm-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="comic-panel-sm flex h-10 w-10 items-center justify-center rounded-full bg-comic-red font-display text-xl text-white">
            S
          </span>
          <span className="font-display text-2xl text-comic-black sm:text-3xl">
            Swahili Komik Con
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) =>
            isLocked(link.href) ? (
              <span
                key={link.href}
                aria-disabled="true"
                className="cursor-not-allowed rounded-full px-4 py-2 font-sans text-sm font-semibold text-comic-black/40"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 font-sans text-sm font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-comic-black text-white"
                    : "text-comic-black hover:bg-comic-black/10",
                )}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <button
          className="comic-panel-sm rounded-full bg-white p-2 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t-2 border-comic-black bg-warm-white px-4 py-3 lg:hidden">
          {links.map((link) =>
            isLocked(link.href) ? (
              <span
                key={link.href}
                aria-disabled="true"
                className="cursor-not-allowed rounded-full px-3 py-2 font-sans text-base font-semibold text-comic-black/40"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-3 py-2 font-sans text-base font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-comic-black text-white"
                    : "text-comic-black hover:bg-comic-black/10",
                )}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
