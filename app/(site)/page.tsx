import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { ComicButton } from "@/components/ui/ComicButton";
import { TierBlock } from "@/components/site/TierBlock";
import { Countdown } from "@/components/site/Countdown";
import { getUpcomingEvent, getPastEvents } from "@/lib/data/events";
import { DEMO_HOMEPAGE_ONLY } from "@/lib/demoMode";

const highlights = [
  {
    title: "Creators",
    copy: "Discover illustrators, animators, cosplayers and studios from across the region.",
    href: "/explore",
  },
  {
    title: "Masterclasses",
    copy: "Hands-on workshops with working creators — topics and dates posted ahead of each event.",
    href: "/masterclasses",
  },
  {
    title: "Competitions",
    copy: "Cosplay, art and gaming competitions with clear rules, eligibility and entry windows.",
    href: "/competitions",
  },
  {
    title: "FanZone",
    copy: "A moderated community space for Anime & Manga, Gaming, Cosplay, Film and African Creators.",
    href: "/fanzone",
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

function shortDate(dateIso: string) {
  return new Date(dateIso)
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Dar_es_Salaam",
    })
    .replace(",", "");
}

export default async function HomePage() {
  const [upcomingEvent, pastEvents] = await Promise.all([
    getUpcomingEvent(),
    getPastEvents(),
  ]);
  const recapEvent = pastEvents[0];
  const shortVenue = upcomingEvent.venue.split(",")[0]?.trim() ?? upcomingEvent.venue;

  return (
    <div>
      {/* Hero */}
      <section className="skc-speed-lines relative border-b-4 border-comic-black px-4 py-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="comic-panel relative overflow-hidden bg-comic-black">
            <div className="relative h-[560px] w-full md:h-[640px]">
              <Image
                src="/images/hero/skc-hero-comic.jpg"
                alt="Comic-style illustration of East African cosplayers, a gamer and a superhero over the Dar es Salaam skyline"
                fill
                priority
                className="object-cover object-[60%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-comic-black/85 via-comic-black/40 to-transparent" />
            </div>

            <div className="skc-caption absolute top-4 left-4 -rotate-2 bg-golden-orange px-3 py-1 text-lg text-comic-black md:top-8 md:left-8 md:text-2xl">
              Issue #2 · {shortDate(upcomingEvent.event_date)} · {shortVenue}
            </div>

            <div className="skc-burst animate-skc-pop absolute top-14 -right-2 grid h-28 w-28 place-items-center bg-golden-orange text-center font-display text-comic-black md:top-8 md:right-8 md:h-40 md:w-40">
              <span className="text-2xl md:text-4xl">KAPOW!</span>
            </div>

            <div className="absolute inset-x-4 bottom-6 md:inset-x-8 md:bottom-10 md:max-w-2xl">
              <h1 className="text-outline font-display text-5xl text-white sm:text-6xl md:text-7xl">
                Your world of <span className="text-comic-red">comics</span>,{" "}
                <span className="text-sky-blue">gaming</span>,{" "}
                <span className="text-hero-green">animation</span> &amp;{" "}
                <span className="text-golden-orange">cosplay!</span>
              </h1>
              <p className="mt-4 inline-block -rotate-1 border-[3px] border-comic-black bg-white px-4 py-2 font-sans font-bold text-comic-black md:text-lg">
                East Africa&apos;s home for the fandom — online, and live in {shortVenue}.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <ComicButton href="/tickets" variant="red" disabled={DEMO_HOMEPAGE_ONLY}>
                  Get Tickets!
                </ComicButton>
                <ComicButton href="/my-skc" variant="blue" disabled={DEMO_HOMEPAGE_ONLY}>
                  Free Fan Pass
                </ComicButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="-rotate-1 border-y-4 border-comic-black bg-comic-black py-3 font-display text-2xl text-white md:text-3xl">
        <div className="whitespace-nowrap text-center">{pillars.join(" ★ ")}</div>
      </div>

      {/* Previously on SKC */}
      {recapEvent && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display mb-8 text-5xl text-comic-black md:text-7xl">
            Previously on SKC…
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="halftone comic-panel bg-sky-blue p-6 md:col-span-2">
              <p className="text-2xl font-bold text-comic-black">
                {recapEvent.title} was nothing short of{" "}
                <span className="font-display text-4xl text-comic-red">legendary.</span>{" "}
                {recapEvent.description}
              </p>
            </div>
            <div className="comic-panel -rotate-1 bg-golden-orange p-6 text-comic-black">
              <h3 className="font-display text-3xl">Cosplay Unleashed</h3>
              <p className="mt-2 font-bold">Craft, performance, accuracy</p>
            </div>
            <div className="comic-panel rotate-1 bg-comic-red p-6 text-white">
              <h3 className="font-display text-3xl">Center Stage</h3>
              <p className="mt-2 font-bold">Showdowns &amp; performances</p>
            </div>
            <div className="comic-panel -rotate-1 bg-hero-green p-6 text-white">
              <h3 className="font-display text-3xl">Creators Celebrated</h3>
              <p className="mt-2 font-bold">Recognition that matters</p>
            </div>
            {DEMO_HOMEPAGE_ONLY ? (
              <div className="comic-panel rotate-1 bg-white p-6 opacity-50" aria-disabled="true">
                <h3 className="font-display text-3xl text-comic-red/40">
                  Relive the gallery →
                </h3>
                <p className="mt-2 font-bold text-comic-black/40">
                  Every corner packed with energy
                </p>
              </div>
            ) : (
              <Link
                href="/past-events"
                className="comic-panel motion-safe-wiggle rotate-1 block bg-white p-6 transition-transform duration-150"
              >
                <h3 className="font-display text-3xl text-comic-red">Relive the gallery →</h3>
                <p className="mt-2 font-bold text-comic-black">
                  Every corner packed with energy
                </p>
              </Link>
            )}
          </div>
        </section>
      )}

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

      {/* Built for the whole fandom */}
      <section className="halftone border-y-4 border-comic-black bg-golden-orange py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display mb-8 text-5xl text-comic-black md:text-7xl">
            Built for the whole fandom
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map(({ title, copy, href }, i) => {
              const cardContent = (
                <>
                  <div className="mb-3 inline-block border-[3px] border-comic-black bg-comic-black px-2 font-display text-white">
                    #{i + 1}
                  </div>
                  <h3 className="font-display text-3xl text-comic-black">{title}</h3>
                  <p className="mt-2 text-comic-black">{copy}</p>
                </>
              );

              if (DEMO_HOMEPAGE_ONLY) {
                return (
                  <div
                    key={title}
                    className="comic-panel bg-white p-5 opacity-50"
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
                  className="comic-panel motion-safe-wiggle block bg-white p-5 transition-transform duration-150"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Access tiers */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-2 text-5xl text-comic-black md:text-7xl">
          Three ways in
        </h2>
        <p className="mb-8 text-lg font-bold text-comic-black">
          One paid ticket, two free community passes.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          <TierBlock
            color="green"
            label="FREE"
            title="SKC Fan Pass"
            description="Track Quest progress and earn your Explorer badge."
            href="/my-skc"
            cta="Claim it"
            disabled={DEMO_HOMEPAGE_ONLY}
          />
          <TierBlock
            color="red"
            label="TICKET"
            title="Get Tickets"
            description="Buy online. Influencer code? Get 10% off."
            href="/tickets"
            cta="Get tickets"
            disabled={DEMO_HOMEPAGE_ONLY}
          />
          <TierBlock
            color="orange"
            label="QUEST"
            title="Guest Pass"
            description="Complete checkpoints at the event for your Explorer badge."
            href="/my-skc"
            cta="Learn more"
            disabled={DEMO_HOMEPAGE_ONLY}
          />
        </div>
      </section>

      {/* Countdown */}
      <section className="border-y-4 border-comic-black bg-comic-black px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-outline font-display mb-2 text-5xl text-golden-orange md:text-7xl">
            {upcomingEvent.title}
          </h2>
          <p className="mb-10 font-bold text-white">
            {shortDate(upcomingEvent.event_date)} · {upcomingEvent.venue} · venue &amp; time TBC
          </p>
          <Countdown targetIso={`${upcomingEvent.event_date}T00:00:00+03:00`} />
        </div>
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
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="halftone comic-panel -rotate-1 bg-sky-blue p-10">
          <h2 className="font-display text-5xl text-comic-black md:text-6xl">
            Get your free Fan Pass!
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-comic-black">
            Free, forever. Track your Quest progress, XP and Explorer badge —
            no payment, ever.
          </p>
          <div className="mt-8 flex justify-center">
            <ComicButton href="/my-skc" variant="red" disabled={DEMO_HOMEPAGE_ONLY}>
              Claim your Fan Pass
            </ComicButton>
          </div>
        </div>
      </section>

    </div>
  );
}
