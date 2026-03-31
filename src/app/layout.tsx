import type { Metadata } from "next";
import { Manrope, Noto_Sans_Arabic, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthGuard from "../components/AuthGuard";
import SiteHeader from "../components/SiteHeader";
import Toast from "../components/Toast";
import { I18nProvider } from "../lib/i18n";
import { ThemeProvider } from "../lib/theme";

const displayFont = Manrope({
  variable: "--font-display-latin",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const bodyLatin = Space_Grotesk({
  variable: "--font-body-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyArabic = Noto_Sans_Arabic({
  variable: "--font-body-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Project Hub",
  description: "A high-signal network and opportunity layer for ambitious builders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyLatin.variable} ${bodyArabic.variable} antialiased`}>
        <ThemeProvider>
          <I18nProvider>
            <SiteHeader />
            <Toast />
            <AuthGuard>
              {children}
            </AuthGuard>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
