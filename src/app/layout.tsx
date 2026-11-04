import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./site.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://127.0.0.1:3000"),
  title: {
    default: "Youth for Peace and Prosperous (YPP)",
    template: "%s | YPP Somalia",
  },
  description:
    "Youth for Peace and Prosperous (YPP) empowers young people through peacebuilding, leadership, capacity development, and inclusive community initiatives in Somalia.",
  keywords: [
    "YPP",
    "Youth for Peace and Prosperous",
    "Somalia peacebuilding",
    "youth empowerment",
    "peace Somalia",
    "nonprofit Somalia",
  ],
  authors: [{ name: "Youth for Peace and Prosperous" }],
  creator: "Youth for Peace and Prosperous (YPP)",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Youth for Peace and Prosperous (YPP)",
    title: "Youth for Peace and Prosperous (YPP)",
    description:
      "Empowering young people through peacebuilding, leadership, and community development in Somalia.",
    images: [{ url: "/images/gallery/1F6A1056.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Youth for Peace and Prosperous (YPP)",
    description: "Empowering young people through peacebuilding in Somalia.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
