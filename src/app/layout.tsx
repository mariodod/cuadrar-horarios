import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuadrar Horarios",
  description: "Encuentra las horas en las que coincidan dos personas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
