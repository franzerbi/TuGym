import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
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
    default: "TuGym",
    template: "%s · TuGym",
  },
  description:
    "Registrá tus entrenamientos, seguí tu peso corporal y visualizá tu progreso.",
  applicationName: "TuGym",
  appleWebApp: {
    capable: true,
    title: "TuGym",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]" style={{ scrollPaddingBottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
