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
  title: "Marjane Digital Wallet",
  description: "Secure and easy digital payments",
};

import LoadingBar from "@/components/ui/LoadingBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-foreground bg-background">
        <ThemeProvider>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
