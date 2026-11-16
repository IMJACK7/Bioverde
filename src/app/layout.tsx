
import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import SiteHeader from "@/features/navigation/components/SiteHeader";

import {
  CartProvider,
} from "@/features/cart/context/CartContext";

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
    default: "BioVerde | Recicla, nutre, renace",
    template: "%s | BioVerde",
  },
  description:
    "Descubre kits de cultivo, abonos orgánicos y herramientas de jardinería. Personaliza tu propio kit con BioVerde.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
