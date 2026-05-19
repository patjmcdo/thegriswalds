import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Griswold Family Photo Archive",
  description:
    "We're collecting family photos, old memories, and anything worth preserving. Upload yours here.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "The Griswold Family Photo Archive",
    description: "Upload your family photos and memories.",
    url: "https://thegriswalds.ca",
    siteName: "The Griswold Family",
    locale: "en_CA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
