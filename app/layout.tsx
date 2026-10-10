import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/materials/app-shell";

export const metadata: Metadata = {
  title: {
    default: "CALYPSO Materials · Discover Materials Under Pressure",
    template: "%s · CALYPSO Materials",
  },
  description:
    "Explore crystal structures, phase transitions, and thermodynamic properties through the CALYPSO High-Pressure Materials Database.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
