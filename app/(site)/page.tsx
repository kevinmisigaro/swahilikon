import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Gamepad2,
  Palette,
  Users,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { ComicButton } from "@/components/ui/ComicButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { PhotoFeatureCard } from "@/components/site/PhotoFeatureCard";
import { TierBlock } from "@/components/site/TierBlock";
import { Countdown } from "@/components/site/Countdown";
import { formatEventDate } from "@/lib/utils";
import { getUpcomingEvent, getPastEvents } from "@/lib/data/events";
import { SKC_AUG_2026_GALLERY } from "@/lib/data/gallery";
import { DEMO_HOMEPAGE_ONLY } from "@/lib/demoMode";

const highlights = [
  {
    icon: Users,
    title: "Creators",
    copy: "Discover illustrators, animators, cosplayers and studios from across the region.",
    href: "/explore",
    color: "bg-sky-blue",
  },
  {
    icon: Palette,
    title: "Masterclasses",
    copy: "Hands-on workshops with working creators — topics and dates posted ahead of each event.",
    href: "/masterclasses",
    color: "bg-golden-orange",
  },
  {
    icon: Gamepad2,
    title: "Competitions",
    copy: "Cosplay, art and gaming competitions with clear rules, eligibility and entry windows.",
    href: "/competitions",
    color: "bg-hero-green",
  },
  {
    icon: Sparkles,
    title: "FanZone",
    copy: "A moderated community space for Anime & Manga, Gaming, Cosplay, Film and African Creators.",
    href: "/fanzone",
    color: "bg-comic-red",
  },
];

const pillars = [
  "COSPLAY",
  "GAMING",
  "ARTIST ALLEY",
  "FANZONE",
  "INFLUENCER DISCOUNTS",
  "MASTERCLASSES",
];

export default async function HomePage() {
  const [upcomingEvent, pastEvents] = await Promise.all([
    getUpcomingEvent(),
    getPastEvents(),
  ]);
  const recapEvent = pastEvents[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-4 border-comic-black">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/skc-hero-main.jpg"
            alt="Cosplayers on stage at Swahili Komik Con"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-comic-black via-comic-black/70 to-comic-black/20" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-start px-4 py-24 sm:px-6 sm:py-32">
          <Badge tone="upcoming">Next event · {formatEventDate(upcomingEvent.event_date)}</Badge>
          <h1 className="font-display mt-4 text-6xl leading-[0.95] text-white sm:text-8xl">
            Your World of
            <br />
            <span className="text-action-orange">Comics</span>,{" "}
            <span className="text-sky-blue">Gaming</span>,
            <br />
            Animation &amp; Cosplay
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Swahili Komik Con is the year-round home for East Africa&apos;s comic,
            gaming, animation and cosplay community — online, and live at{" "}
            {upcomingEvent.venue}.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ComicButton href="/tickets" variant="red" disabled={DEMO_HOMEPAGE_ONLY}>
              Get Tickets
            </ComicButton>
            <ComicButton
              href={`/events/${upcomingEvent.slug}`}
              variant="outline"
              disabled={DEMO_HOMEPAGE_ONLY}
            >
              {upcomingEvent.title}
            </ComicButton>
          </div>
        </div>
      </section>

      {/* Recap */}
      {recapEvent && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-4 border-golden-orange shadow-[6px_6px_0_var(--color-comic-black)]">
              <Image
                src={recapEvent.cover_image ?? SKC_AUG_2026_GALLERY[19]}
                alt={recapEvent.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 400px, 100vw"
              />
            </div>
            <div>
              <Badge tone="past">Last time</Badge>
              <h2 className="font-display mt-3 text-4xl text-comic-black sm:text-5xl">
                {recapEvent.title} was nothing short of legendary.
              </h2>
              <p className="mt-4 text-comic-black/75">{recapEvent.description}</p>
              <p className="mt-3 text-comic-black/75">
                From stunning cosplay to stage showdowns and creator moments,
                every corner was packed with energy — a glimpse of what SKC
                Reloaded / Tanzanite has in store.
              </p>
              {DEMO_HOMEPAGE_ONLY ? (
                <span
                  className="mt-5 inline-flex items-center gap-1 font-display text-lg text-comic-red/40"
                  aria-disabled="true"
                >
                  Relive the gallery <ArrowRight size={18} />
                </span>
              ) : (
                <Link
                  href="/past-events"
                  className="mt-5 inline-flex items-center gap-1 font-display text-lg text-comic-red hover:underline"
                >
                  Relive the gallery <ArrowRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Feature photo grid */}
      <section className="halftone border-y-4 border-comic-black bg-comic-black px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The energy"
            title="This is what SKC feels like"
            align="center"
            className="[&_h2]:text-white [&_p]:bg-golden-orange [&_p]:text-comic-black"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <PhotoFeatureCard
              image={SKC_AUG_2026_GALLERY[4]}
              title="Cosplay Unleashed"
              subtitle="Craft, performance, accuracy"
              color="red"
            />
            <PhotoFeatureCard
              image={SKC_AUG_2026_GALLERY[9]}
              title="Center Stage"
              subtitle="Showdowns & performances"
              color="blue"
            />
            <PhotoFeatureCard
              image={SKC_AUG_2026_GALLERY[24]}
              title="Creators Celebrated"
              subtitle="Recognition that matters"
              color="green"
            />
          </div>

          <div className="mt-14 text-center">
            <h3 className="font-display text-3xl text-white sm:text-4xl">
              One Day of Fandom, Gaming &amp; Cosplay
            </h3>
            <p className="mt-3 text-sm font-bold tracking-[0.15em] text-white/70 uppercase">
              {pillars.join(" · ")}
            </p>
          </div>
        </div>
      </section>

      {/* Referral strip */}
      <section className="halftone border-b-4 border-comic-black bg-golden-orange/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-3">
            <span className="comic-panel-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-comic-black text-white">
              <Ticket size={22} />
            </span>
            <p className="font-sans text-base font-semibold text-comic-black">
              Got an influencer referral code for {upcomingEvent.title}? Add
              it at checkout for 10% off your ticket.
            </p>
          </div>
          <ComicButton
            href="/tickets"
            variant="black"
            className="shrink-0"
            disabled={DEMO_HOMEPAGE_ONLY}
          >
            Get Tickets <ArrowRight size={18} />
          </ComicButton>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Explore SKC" title="Built for the whole fandom" align="center" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, copy, href, color }) => {
            const cardContent = (
              <>
                <span
                  className={`comic-panel-sm flex h-12 w-12 items-center justify-center rounded-full ${color} text-white`}
                >
                  <Icon size={22} />
                </span>
                <h3 className="font-display text-2xl text-comic-black">{title}</h3>
                <p className="text-sm text-comic-black/70">{copy}</p>
              </>
            );

            if (DEMO_HOMEPAGE_ONLY) {
              return (
                <div
                  key={title}
                  className="comic-panel flex flex-col gap-3 rounded-2xl bg-white p-5 opacity-50"
                  aria-disabled="true"
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={title}
                href={href}
                className="comic-panel motion-safe-wiggle flex flex-col gap-3 rounded-2xl bg-white p-5 transition-transform duration-150"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Access tiers */}
      <section className="border-y-4 border-comic-black bg-warm-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="How to join" title="Three ways in" align="center" />
          <p className="mx-auto mt-3 max-w-xl text-center text-comic-black/70">
            One paid ticket, two free community passes — here&apos;s how fans get in.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <TierBlock
              color="red"
              label="FREE"
              title="SKC Fan Pass"
              description="Your entry into the SKC community — track Quest progress and your Explorer badge."
              href="/my-skc"
              cta="Claim it"
              disabled={DEMO_HOMEPAGE_ONLY}
            />
            <TierBlock
              color="blue"
              label="TICKET"
              title="Get Tickets"
              description="Buy your ticket online. Have a code from an influencer? Add it for 10% off."
              href="/tickets"
              cta="Get tickets"
              disabled={DEMO_HOMEPAGE_ONLY}
            />
            <TierBlock
              color="green"
              label="QUEST"
              title="Guest Pass"
              description="Open a guest pass at the event and complete checkpoints to earn your Explorer badge."
              href="/my-skc"
              cta="Learn more"
              disabled={DEMO_HOMEPAGE_ONLY}
            />
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="halftone-red border-b-4 border-comic-black bg-comic-black px-4 py-20 text-center sm:px-6">
        <p className="font-display text-sm tracking-[0.3em] text-golden-orange uppercase">
          Mark your calendar
        </p>
        <h2 className="font-display mt-2 text-4xl text-white sm:text-5xl">
          {upcomingEvent.title} Starts In
        </h2>
        <div className="mx-auto mt-8 max-w-xl">
          <Countdown targetIso={`${upcomingEvent.event_date}T00:00:00+03:00`} />
        </div>
        <p className="mt-4 text-xs text-white/50">
          Exact start time TBC — {formatEventDate(upcomingEvent.event_date)},{" "}
          {upcomingEvent.venue}.
        </p>
      </section>

      {/* Venue */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="font-display text-sm tracking-[0.3em] text-comic-black/50 uppercase">
            Where to find us
          </p>
          <h2 className="font-display mt-2 bg-gradient-to-r from-comic-red to-golden-orange bg-clip-text text-4xl text-transparent sm:text-5xl">
            {upcomingEvent.venue}
          </h2>
          <p className="mt-2 text-comic-black/60">Exact venue details to be confirmed.</p>
        </div>
        <div className="comic-panel mt-8 overflow-hidden rounded-2xl">
          <iframe
            title="Map of Dar es Salaam, Tanzania"
            src="https://www.openstreetmap.org/export/embed.html?bbox=39.15%2C-6.90%2C39.35%2C-6.70&layer=mapnik"
            className="h-80 w-full grayscale sm:h-96"
            loading="lazy"
          />
        </div>
      </section>

      {/* Fan Pass CTA */}
      <section className="border-y-4 border-comic-black bg-hero-green text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-4xl sm:text-5xl">Get your free SKC Fan Pass</h2>
          <p className="max-w-xl text-white/90">
            The Fan Pass is free, forever. Track your Quest progress, your XP and
            your Explorer badge — no payment, ever.
          </p>
          <ComicButton href="/my-skc" variant="outline" disabled={DEMO_HOMEPAGE_ONLY}>
            Claim your Fan Pass
          </ComicButton>
        </div>
      </section>

      {/* Past events teaser */}
      {pastEvents.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Relive it" title="From the last SKC" />
            {DEMO_HOMEPAGE_ONLY ? (
              <span
                className="font-sans text-sm font-bold text-comic-red/40"
                aria-disabled="true"
              >
                See the full gallery →
              </span>
            ) : (
              <Link
                href="/past-events"
                className="font-sans text-sm font-bold text-comic-red hover:underline"
              >
                See the full gallery →
              </Link>
            )}
          </div>
          <div className="mt-8">
            <GalleryGrid
              images={SKC_AUG_2026_GALLERY}
              limit={8}
              altPrefix="Swahili Komik Con — 2 August 2026"
            />
          </div>
        </section>
      )}
    </div>
  );
}
