import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNPEC Collecte",
  description: "Plateforme nationale de collecte economique DNPEC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
