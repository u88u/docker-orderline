import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Smart Order Micro-Stack",
  description:
    "Submit orders and follow their processing through Nginx, FastAPI, Redis and a background worker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink-950 font-sans text-ink-100">
        {children}
      </body>
    </html>
  );
}