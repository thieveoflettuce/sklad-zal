"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ReportPeriod } from "@/lib/types";

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "day", label: "День" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "Квартал" },
  { id: "year", label: "Год" },
];

function inPeriod(iso: string, period: ReportPeriod) {
  const at = new Date(iso);
  const now = new Date();
  if (period === "day") {
    return at.toDateString() === now.toDateString();
  }
  if (period === "month") {
    return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return at.getFullYear() === now.getFullYear() && Math.floor(at.getMonth() / 3) === q;
  }
  return at.getFullYear() === now.getFullYear();
}

export default function ReportsPage() {
  const { usage } = useStore();
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const rows = usage.filter((e) => inPeriod(e.at, period) && e.delta < 0);
  const grouped = Object.values(
    rows.reduce<Record<string, { name: string; used: number; unit: string }>>(
      (acc, event) => {
        const cur = acc[event.name] ?? {
          name: event.name,
          used: 0,
          unit: event.unit,
        };
        cur.used += Math.abs(event.delta);
        acc[event.name] = cur;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.used - a.used);

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Отчёты</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <div className="periods">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={period === p.id ? "chip is-on" : "chip"}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="stat">{rows.length}</p>
      <p className="hint">операций списания за период</p>
      {grouped.map((row, i) => (
        <div key={row.name} className="line" style={{ animationDelay: `${i * 50}ms` }}>
          <span>
            {i + 1}. {row.name}
          </span>
          <span>
            −{row.used} {row.unit}
          </span>
        </div>
      ))}
    </>
  );
}
