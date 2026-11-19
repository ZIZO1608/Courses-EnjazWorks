"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1" aria-label="Admin">
      {items.map((item) => {
        const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`btn btn-sm shrink-0 ${active ? "btn-primary" : "btn-ghost"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
