import type { Metadata } from "next";
import Link from "next/link";
import MainNav from "@/components/MainNav";
import "./globals.css";

// Default metadata for the application. This is used for SEO and tab information.
export const metadata: Metadata = {
  title: "DevPulse — Internal Engineering Metrics",
  description: "An internal dashboard for tracking engineering team performance and velocity.",
};

/**
 * RootLayout is the main layout component for the entire application.
 * It sets up the global HTML structure, including a sticky navigation bar and a consistent content area.
 * Centralizing the layout here ensures a consistent user experience and simplifies page components.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-100">
        {/* Header section containing the main logo and navigation. It remains sticky at the top. */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 md:px-8 sticky top-0 z-50">
          <div className="h-16 flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo linking back to the main dashboard. */}
            <Link href="/" className="text-xl font-bold text-indigo-600">
              DevPulse
            </Link>
            {/* Primary navigation component. */}
            <MainNav />
          </div>
        </header>

        {/* Main content area where page-specific components are rendered. */}
        {/* The container provides consistent padding and max-width for all pages. */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
