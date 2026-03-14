import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/dashboard/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeenCare – Mini LMS",
  description: "Hệ thống quản lý Học sinh – Phụ huynh & Lớp học",
  icons: {
    icon: "/logo/favicon.jpeg",
    shortcut: "/logo/favicon.jpeg",
    apple: "/logo/favicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="mx-auto max-w-7xl p-6 pt-20 lg:pt-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
