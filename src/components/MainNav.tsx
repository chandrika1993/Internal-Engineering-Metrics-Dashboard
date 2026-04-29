"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// An array of navigation links with their labels and corresponding paths.
const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Compare", href: "/compare" },
];

/**
 * MainNav is the primary navigation component for the application.
 * It renders a list of links and highlights the currently active link based on the URL path.
 * This component is designed to be used within the main layout of the application.
 */
export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 sm:gap-6">
      {navLinks.map((link) => {
        
        /**
         * Active state uses exact match for "/" to avoid it matching every route.
         * All other routes use startsWith for nested paths like /teams/[slug].
         */
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              isActive
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
