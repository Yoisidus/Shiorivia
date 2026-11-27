import type { Metadata, Viewport } from "next";
// Fontsource ships version-locked font assets with npm; builds need no Google Fonts access.
import "@fontsource-variable/inter";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/700.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Script from "next/script"; 
import { MusicProvider } from "../context/MusicContext";
import { LanguageProvider } from "../context/LanguageContext";
import { DialogProvider } from "../context/DialogContext";

export const metadata: Metadata = {
  // Local Edition: relative Open Graph assets resolve against the local server.
  metadataBase: new URL("http://localhost:3000"),
  title: "Shiorivia",
  description: "Shiorivia — a local-first, customizable AI story and chat experience.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Shiorivia",
    description: "Where Stories Find Their Way.",
    images: [{ url: "/shiorivia-og.png", width: 1200, height: 630, alt: "Shiorivia Star Road" }],
  },
  twitter: { card: "summary_large_image", images: ["/shiorivia-og.png"] },
  icons: {
    icon: "/icon.svg",
    apple: "/shiorivia-app-icon.png",
  },
  // Avoid Next's default legacy status-bar-style meta: modern iOS samples the page.
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Shiorivia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", 
  themeColor: "#f6f8f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <div className="ios-standalone-edge-sample" aria-hidden="true" />
        <div className="ios-browser-bottom-edge-sample" aria-hidden="true" />
        <Script 
          src="/lib/live2d.min.js" 
          strategy="beforeInteractive" 
        />
        
        {process.env.NEXT_PUBLIC_ENABLE_LOCAL_LIVE2D === "true" && <Script
          src="/lib/live2dcubismcore.min.js"
          strategy="beforeInteractive"
        />}
        
        <Script 
          src="/lib/vconsole.min.js"
          strategy="beforeInteractive"
        />
        <Script id="init-vconsole" strategy="afterInteractive">
          {`
            // 简单的移动端检测正则
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                var vConsole = new VConsole();
            }
          `}
        </Script>
        <MusicProvider>
          <LanguageProvider><DialogProvider>{children}</DialogProvider></LanguageProvider>
        </MusicProvider>
      </body>
    </html>
  );
}