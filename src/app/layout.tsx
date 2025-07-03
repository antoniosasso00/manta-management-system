import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "Manta Group - MES Aerospazio",
    template: "%s | Manta Group MES"
  },
  description: "Manufacturing Execution System per la produzione di componenti aerospaziali in fibra di carbonio",
  keywords: ["MES", "Manufacturing", "Aerospazio", "Fibra di carbonio", "Produzione", "Manta Group"],
  authors: [{ name: "Manta Group" }],
  creator: "Manta Group",
  publisher: "Manta Group",
  applicationName: "Manta MES",
  generator: "Next.js",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-icon.png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Manta MES',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Manta Group MES',
    title: 'Manta Group - MES Aerospazio',
    description: 'Manufacturing Execution System per la produzione aerospaziale',
    url: 'https://mes.mantagroup.it',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Manta Group Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Manta Group MES',
    description: 'Manufacturing Execution System per la produzione aerospaziale',
    images: ['/android-chrome-512x512.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1976d2' },
    { media: '(prefers-color-scheme: dark)', color: '#1976d2' }
  ],
  category: 'Manufacturing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
