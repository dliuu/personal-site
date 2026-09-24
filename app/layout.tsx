import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Danny Liu",
  description:
    "Backend and ML engineer. Financial infrastructure, AI translation at scale, lending platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
