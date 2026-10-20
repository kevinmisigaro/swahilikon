import type { Metadata } from "next";
import { Bangers, Poppins } from "next/font/google";
import "./globals.css";

const bangers = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Swahili Komik Con — Your World of Comics, Gaming, Animation & Cosplay",
    template: "%s | Swahili Komik Con",
  },
  description:
    "The digital home of Swahili Komik Con: events, creators, competitions, FanZone and the official influencer referral-code registration for SKC Reloaded / Tanzanite.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="bg-grain flex min-h-full flex-col bg-warm-white text-comic-black">
        {children}
      </body>
    </html>
  );
}
