import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tokenised Cash Leg — Two Demos",
  description:
    "Concept demos: settling HSBC money-market fund units against tokenised deposits, and automated cash pooling on a 24/7 tokenised rail.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper-50 text-ink-900">{children}</body>
    </html>
  );
}
