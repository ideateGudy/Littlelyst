import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppInitializer } from "@/components/ui/app-initializer";
import { CartSheet } from "@/components/ui/cart-sheet";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://littlelyst.com"),
  title: {
    default: "Littlelyst — Your Products. One Link. Instant Online Payments.",
    template: "%s | Littlelyst",
  },
  description:
    "The social-first individual commerce catalogue. Create a personal storefront in under 5 minutes, share on WhatsApp Status, and receive payments with zero buyer logins.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  keywords: [
    "personal product catalogue",
    "social commerce nigeria",
    "whatsapp status store",
    "sell on whatsapp",
    "instagram shop link",
    "paystack store",
    "individual commerce",
    "digital products seller",
    "online catalogue builder",
    "google business profile website",
    "side hustle store",
    "zero login ecommerce",
  ],
  authors: [{ name: "Littlelyst Product Team" }],
  creator: "Littlelyst",
  publisher: "Littlelyst",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://littlelyst.com",
    siteName: "Littlelyst",
    title: "Littlelyst — Your Products. One Link. Instant Online Payments.",
    description:
      "Turn your phone into a live, payable storefront in under 5 minutes. No buyer logins, share directly on WhatsApp & Instagram.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=1200&h=630&q=85",
        width: 1200,
        height: 630,
        alt: "Littlelyst — Social-First Individual Commerce Catalogue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Littlelyst — Your Products. One Link. Instant Online Payments.",
    description:
      "Sell directly on WhatsApp, Instagram & Google Business Profile with zero buyer logins and instant payments.",
    images: [
      "https://images.unsplash.com/photo-1556742049-0a67e55722c0?auto=format&fit=crop&w=1200&h=630&q=85",
    ],
    creator: "@littlelyst",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/*
          Theme initializer: runs synchronously before paint to prevent FOUC.
          Must use Next.js <Script strategy="beforeInteractive"> — not a bare <script> tag —
          to avoid the React hydration warning about scripts inside components.
        */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('littlelyst-theme');
                var root = document.documentElement;
                if (saved === 'light') {
                  root.classList.remove('dark'); root.classList.add('light');
                  root.setAttribute('data-theme', 'light');
                  root.style.colorScheme = 'light';
                } else {
                  root.classList.add('dark'); root.classList.remove('light');
                  root.setAttribute('data-theme', 'dark');
                  root.style.colorScheme = 'dark';
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#050505] text-[#e5e4e2] overflow-x-hidden selection:bg-emerald-500 selection:text-black">
        {/* Paystack inline.js — loads async, no blocking */}
        <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />

        {/* No Context Providers — all state is Zustand. AppInitializer boots auth + theme. */}
        <AppInitializer />
        {children}
        <CartSheet />
      </body>
    </html>
  );
}
