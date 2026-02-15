import type { Metadata } from "next";
import { Outfit, Paytone_One, Nunito } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import layoutStyles from "./layout.module.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const paytoneOne = Paytone_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nurture",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Artistryx",
  description: "Early childhood learning products – hands-on materials for children",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${paytoneOne.variable} ${nunito.variable}`}>
      <body className={outfit.className}>
        <div className={layoutStyles.appWrapper}>
          <SiteHeader />
          <main className={layoutStyles.mainWrap}>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
