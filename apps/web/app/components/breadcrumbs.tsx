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
          {index > 0 && <span className="text-neutral-300">/</span>}
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-neutral-500 hover:text-violet-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.active ? "text-neutral-900 font-semibold" : "text-neutral-500"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
