"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { demandById } from "@/lib/catalog";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "Зал" },
  { href: "/stellazh", label: "Стеллаж" },
  { href: "/inventarizaciya", label: "Счёт" },
  { href: "/dokazaz", label: "Заказ" },
  { href: "/otchety", label: "Отчёты" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { demandId } = useStore();
  const demand = demandById(demandId);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          SKLAD
        </Link>
        <p className="topbar-meta">Зал · {demand.label}</p>
      </header>
      <main className="stage">{children}</main>
      <nav className="dock" aria-label="Разделы">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "dock-link is-active" : "dock-link"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
