import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Cosmos — An Interactive Mind Atlas",
  description: "A navigable particle brain and personal cosmos of research, music, art and memory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
