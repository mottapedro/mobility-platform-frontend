import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";
import { WebMCPIntegration } from '@/components/WebMCPIntegration';


const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="pt-BR" className={`${dmSans.variable} h-full`}>
      <body className={`${dmSans.variable} min-h-full bg-[#0D0700] font-[family-name:var(--font-dm-sans)] text-[#F5ECD8] antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        
        <WebMCPIntegration />
      </body>
    </html>
  );
}
