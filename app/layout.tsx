import type { Metadata } from "next";
import { profile } from "@/instruments/content";
import "./globals.css";

export const metadata: Metadata = {
  title: profile.name,
  description: profile.line,
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
