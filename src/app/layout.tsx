import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/Navbar";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatBox } from "@/components/ChatBox";
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
  title: "PT-Prep 物理治療國考",
  description: "物理治療師國考題庫與解析系統",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PT-Prep",
  },
  icons: {
    icon: "/PWA192x192.png",
    apple: "/PWA192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ChatProvider>
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">{children}</main>
            <ChatBox />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
