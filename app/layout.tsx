import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zhangyici9713.github.io"),
  title: "Personal Cosmos — An Interactive Mind Atlas",
  description: "A freely navigable particle brain and deep-space atlas with many entrances into research, music, art, projects and memory.",
  openGraph: {
    title: "Personal Cosmos — A Mind With Many Entrances",
    description: "Fly through a particle brain, many galaxies and five explorable inner worlds.",
    url: "/",
    siteName: "Personal Cosmos",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "A particle brain flowing into a field of many galaxies" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Cosmos — A Mind With Many Entrances",
    description: "Fly through a particle brain, many galaxies and five explorable inner worlds.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
