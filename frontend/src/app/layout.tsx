import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marjane Wallet",
  description: "Secure and easy digital payments",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  themeColor: "#080C17",
};

import LoadingBar from "@/components/ui/LoadingBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth dark`} dir="ltr">
      <body className="font-sans antialiased text-foreground bg-background selection:bg-primary/20 selection:text-foreground">
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={null}>
                <LoadingBar />
              </Suspense>
              {children}
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
