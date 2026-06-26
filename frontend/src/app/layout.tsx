import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Marjane Wallet",
  description: "Secure and easy digital payments",
};

import LoadingBar from "@/components/ui/LoadingBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth dark`}>
      <body className="font-sans antialiased text-foreground bg-background">
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <LoadingBar />
            </Suspense>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
