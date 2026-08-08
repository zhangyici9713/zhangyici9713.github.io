import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zhangyici9713.github.io"),
  title: "Personal Atlas — A Continuous Mind & Cosmos",
  description: "A continuous three-dimensional personal atlas connecting research, products, music, art, writing, photography, and memory.",
  openGraph: {
    title: "Personal Atlas — A Continuous Mind & Cosmos",
    description: "Travel through a living neural landscape or a field of galaxies, discovering the work and memories suspended within it.",
    url: "/",
    siteName: "Personal Atlas",
    images: [{ url: "/og-v2.png", width: 1728, height: 910, alt: "A continuous personal atlas between a neural landscape and deep space" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Atlas — A Continuous Mind & Cosmos",
    description: "A continuous 3D atlas connecting research, products, music, art, writing, photography, and memory.",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
