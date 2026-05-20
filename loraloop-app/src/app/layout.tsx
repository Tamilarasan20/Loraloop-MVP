import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lora Loop — Brand Knowledge Base",
  description: "AI-powered brand DNA extraction and knowledge base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFBFC] text-[#0A0A0A] min-h-screen flex flex-col`}
      >
        <div className="flex flex-1 min-h-0">
          <Suspense fallback={<div className="w-[220px] shrink-0 bg-[#FAFBFC] border-r border-[#E5E7EB]" />}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 min-w-0 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
