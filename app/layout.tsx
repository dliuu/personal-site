import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "personal-site lab",
  description: "A lab for trying 3D ideas.",
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
