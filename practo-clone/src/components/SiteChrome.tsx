"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import PageLoadAnimation from "@/components/PageLoadAnimation";

/**
 * Renders the public site's Navbar/Footer/ChatBot (with the page-load
 * animation) around every route EXCEPT /admin/*, which has its own nav
 * (AdminSidebar + AdminHeader, via AdminShell) and must not also show the
 * patient/doctor-facing Navbar and Footer.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <PageLoadAnimation>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBot />
    </PageLoadAnimation>
  );
}