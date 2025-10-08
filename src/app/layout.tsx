import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import ClientAuthSync from "../components/ClientAuthSync";
import SiteFooter from "../components/SiteFooter";
import { ErrorBoundary } from "../components/ErrorBoundary";
import CrispChat from "../components/CrispChat";
import ExitIntentPopup from "../components/ExitIntentPopup";
import AccessibilityChecker from "../components/AccessibilityChecker";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Reviews & Marketing — Turn Happy Customers into 5★ Reviews",
    template: "%s | Reviews & Marketing",
  },
  description:
    "One connected workspace for review links, QR codes, and real-time customer feedback. Start free, no credit card required.",
  keywords: [
    "review management",
    "customer reviews",
    "QR code generator",
    "review collection",
    "Google reviews",
    "business reviews",
    "review automation",
    "customer feedback",
    "review analytics",
    "local business marketing",
  ],
  authors: [{ name: "Reviews & Marketing" }],
  creator: "Reviews & Marketing",
  publisher: "Reviews & Marketing",
  metadataBase: new URL("https://reviewsandmarketing.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Reviews & Marketing — Turn Happy Customers into 5★ Reviews",
    description:
      "One connected workspace for review links, QR codes, and real-time customer feedback. Start free today.",
    url: "https://reviewsandmarketing.com",
    siteName: "Reviews & Marketing",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reviews & Marketing Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reviews & Marketing — Turn Happy Customers into 5★ Reviews",
    description: "Collect reviews faster with one connected workspace. Start free today.",
    creator: "@reviewsandmktg",
    images: ["/og-image.png"],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured data for organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Reviews & Marketing",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free Starter plan available"
    },
    "description": "One connected workspace for review links, QR codes, and real-time customer feedback.",
    "url": "https://reviewsandmarketing.com",
    "screenshot": "https://reviewsandmarketing.com/og-image.png"
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
          <script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            async
            defer
          />
        ) : null}
        <ErrorBoundary>
          <ClientAuthSync />
          <SiteHeader />
          {children}
          <SiteFooter />
          {/* Live chat widget */}
          <CrispChat />
          {/* Exit-intent popup for email capture */}
          <ExitIntentPopup delay={5000} cookieExpiry={7} />
          {/* Accessibility checker (dev only) */}
          {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
        </ErrorBoundary>
      </body>
    </html>
  );
}
