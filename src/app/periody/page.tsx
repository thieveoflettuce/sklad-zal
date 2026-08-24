"use client";

import Link from "next/link";
import { DEMANDS } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export default function PeriodsPage() {
  const { demandId, setDemandId } = useStore();

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Периоды</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        Лето, межсезонье, выходные, корпоративы, праздники — каждое меняет
        объём дозаказа.
      </p>
      <div className="demand-list">
        {DEMANDS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={demandId === d.id ? "demand is-on" : "demand"}
            onClick={() => setDemandId(d.id)}
          >
            <span className="demand-title">
              {d.label}
              <span>×{d.mult}</span>
            </span>
            <p className="demand-meta">
              {d.hint}. {d.example}
            </p>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Link className="btn" href="/dokazaz">
          Смотреть корзину
        </Link>
      </div>
    </>
  );
}
