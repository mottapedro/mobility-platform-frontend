import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aliado",
  description: "Plataforma Aliado de agendamento de corridas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full`}>
      <body className={`${montserrat.variable} min-h-full bg-[#1E140F] font-[family-name:var(--font-montserrat)] text-[#E6D2B3] antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
