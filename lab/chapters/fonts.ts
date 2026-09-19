import { Fraunces, Inter } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const body = Inter({ subsets: ["latin"], variable: "--font-body" });
