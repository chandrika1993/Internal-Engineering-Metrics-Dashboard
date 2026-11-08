"use client";

import { startDemo } from "@/demo/runtime";

const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

// Install the in-browser API before any page component fetches data.
if (isDemo) startDemo();

export default function DemoMode() {
  if (!isDemo) return null;
  return (
    <div
      role="note"
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur-sm"
    >
      Live demo: PostgreSQL runs in your browser with sample data.{" "}
      <a
        className="underline underline-offset-2"
        href="https://github.com/chandrika1993/internal-engineering-metrics-dashboard"
        target="_blank"
        rel="noopener noreferrer"
      >
        View code
      </a>
    </div>
  );
}
