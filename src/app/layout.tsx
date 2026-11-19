import type { Metadata, Viewport } from "next";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { ServiceWorker } from "@/components/ServiceWorker";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: { default: "دورات إنجازوورك | enjazwork courses", template: "%s | إنجازوورك" },
  description: "سجّل بدورات وورشات إنجازوورك وتابع طلبك وإشعاراتك من جوالك.",
  manifest: "/manifest.webmanifest",
  applicationName: "إنجازوورك",
  appleWebApp: { capable: true, title: "إنجازوورك", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7a1e3c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          <span className="latin">Empower. Execute. Excel.</span>
          <span className="mx-2">·</span>
          <a href="https://enjazwork.com" className="hover:text-brand latin">
            enjazwork.com
          </a>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}
