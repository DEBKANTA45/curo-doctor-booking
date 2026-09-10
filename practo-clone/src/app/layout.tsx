import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { AuthProvider } from "@/context/AuthContext";
import PageLoadAnimation from "@/components/PageLoadAnimation";
import { Toaster } from "react-hot-toast";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Curo — Find and book the right doctor",
  description:
    "Search doctors by specialty and city, compare fees and ratings, and book an appointment in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <PageLoadAnimation>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatBot />
          </PageLoadAnimation>
        </AuthProvider>
      </body>
    </html>
  );
}