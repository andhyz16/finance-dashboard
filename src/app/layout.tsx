import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceKu - Kelola Keuangan Anda",
  description: "Aplikasi pengelolaan keuangan pribadi, analisis saham, crypto, dan instrumen keuangan lainnya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
