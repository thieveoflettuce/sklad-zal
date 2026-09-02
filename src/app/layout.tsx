import type { Metadata } from "next";
import { Onest, Unbounded } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";

const brand = Unbounded({
  variable: "--font-brand",
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
});

const ui = Onest({
  variable: "--font-ui",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SKLAD · Зал",
  description: "Склад зала: баланс, приёмка, дозаказ и отчёты",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${brand.variable} ${ui.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <AppFrame>{children}</AppFrame>
        </StoreProvider>
      </body>
    </html>
  );
}
