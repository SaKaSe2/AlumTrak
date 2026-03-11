import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlumniTrace - Sistem Pelacakan Alumni UMM",
  description: "Sistem pelacakan alumni otomatis Universitas Muhammadiyah Malang",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
