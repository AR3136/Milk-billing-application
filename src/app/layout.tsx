import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: {
    default: 'Ganga Dairy Farm',
    template: '%s | Ganga Dairy Farm',
  },
  description: 'Professional milk billing and customer management system for Ganga Dairy Farm.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png',  sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png',  sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon-32x32.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ganga Dairy',
    startupImage: '/icons/apple-touch-icon.png',
  },
  applicationName: 'Ganga Dairy Farm',
  keywords: ['dairy', 'milk', 'billing', 'invoice', 'farm management'],
  authors: [{ name: 'Ganga Dairy Farm' }],
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dark mode flash prevention */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        {/* PWA / mobile browser hints */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ganga Dairy" />
        <meta name="application-name" content="Ganga Dairy Farm" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="none" />
        {/* Apple splash / touch icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-180x180.png" />
        {/* Standard favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/icons/favicon-32x32.png" />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
