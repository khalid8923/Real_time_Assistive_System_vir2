"use client";

import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumbs({
  items,
  showHome = true,
  className,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="مسار التنقل"
      dir="rtl"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {showHome && (
        <>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span>الرئيسية</span>
          </Link>
          {items.length > 0 && (
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1",
                  isLast && "font-bold text-foreground"
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
          </span>
        );
      })}
    </nav>
  );
}