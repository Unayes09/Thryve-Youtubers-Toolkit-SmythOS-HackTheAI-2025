import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const siteName = "Thryve";
const siteTitle = "Thryve | From idea to impact, effortlessly.";
const siteDescription =
  "AI-first workflow to fetch videos, generate ideas, craft thumbnails, and scale your channel.";
const siteUrl = "https://thryve.app";
const ogImageUrl = "/logo.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "Thryve" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl],
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  alternates: { canonical: siteUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: ogImageUrl,
  };

  const productLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body
          className={`${poppins.variable} antialiased text-[#2d2d2b] bg-white`}
        >
          <Toaster richColors position="top-center" />
          {children}
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([organizationLd, productLd]),
            }}
          />
          {/* Lightweight analytics placeholder */}
          <script
            dangerouslySetInnerHTML={{
              __html: "window.__analytics=window.__analytics||{}",
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
