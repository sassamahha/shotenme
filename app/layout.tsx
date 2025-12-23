import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shoten.me"),
  title: "Shoten.me",
  description: "あなたの本棚、今日から「書店」。読んだ本・推した本を棚に並べるだけの書店をつくるサービス",
  openGraph: {
    type: "website",
    url: "https://shoten.me",
    title: "Shoten.me",
    description: "あなたの本棚、今日から「書店」。読んだ本・推した本を棚に並べるだけの書店をつくるサービス",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shoten.me",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoten.me",
    description: "あなたの本棚、今日から「書店」。読んだ本・推した本を棚に並べるだけの書店をつくるサービス",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
