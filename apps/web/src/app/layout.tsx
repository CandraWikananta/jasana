import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SkipLink } from "@/components/layout/skip-link";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Jasana", template: "%s | Jasana" },
  description: "Cari dan pesan jasa di sekitarmu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // scroll-pt: header yang menempel tidak menutupi elemen yang difokus (dua baris di HP, satu baris mulai md).
    <html lang="id" className={`${jakarta.variable} scroll-pt-32 md:scroll-pt-20`}>
      <body>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
