"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-white/30">/</span>}
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-white/50 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? "text-white" : "text-white/50"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
