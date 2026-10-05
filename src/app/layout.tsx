import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beyblade X Tournament HQ",
  description:
    "Run official Beyblade X 3on3 tournaments: build decks, register bladers, judge matches and track standings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-arena-950 font-sans text-white antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
