import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevPulse — Engineering Metrics",
  description: "Internal engineering metrics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-indigo-600">
            DevPulse
          </a>
          <div className="flex gap-4 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/compare" className="text-gray-600 hover:text-gray-900">
              Compare
            </a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
