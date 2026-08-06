import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Cosmos — An Interactive Mind Atlas",
  description: "An explorable universe of research, products, music, art and memory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
