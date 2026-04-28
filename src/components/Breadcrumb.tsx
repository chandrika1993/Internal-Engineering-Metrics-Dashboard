import Link from "next/link";
import { Fragment } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string; // Optional: if provided, it's a link; if not, it's plain text (active page)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={item.label}>
            {item.href && !isLast ? (
              <Link 
                href={item.href} 
                className="hover:text-indigo-600 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {item.label}
              </span>
            )}
            
            {/* Show separator if not the last item */}
            {!isLast && (
              <span className="text-gray-300" aria-hidden="true">/</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}