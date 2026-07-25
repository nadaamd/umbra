import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CircuitBreaker.ai — Autonomous DeFi Risk Terminal",
  description:
    "Autonomous financial circuit breaker for DeFi. CBRI risk scoring, backtest to optimal threshold τ*, 1inch emergency evacuation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${sans.variable} ${mono.variable} font-sans grain antialiased`}>
        {children}
      </body>
    </html>
  );
}
