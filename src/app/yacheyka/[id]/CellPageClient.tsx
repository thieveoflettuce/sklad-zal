"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { calcTarget, demandById } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export function CellPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { cellById, setQty, demandId } = useStore();
  const cell = cellById(id);
  const demand = demandById(demandId);
  const [draft, setDraft] = useState<number | null>(null);

  if (!cell || cell.qty === null) {
    return (
      <>
        <h1 className="h1">Ячейка пуста</h1>
        <Link className="btn" href="/stellazh">
          К стеллажу
        </Link>
      </>
    );
  }

  const qty = draft ?? cell.qty;
  const target = calcTarget(cell.min, demand.mult);

  return (
    <>
      <div className="page-head">
        <h1 className="h1">{cell.name}</h1>
        <Link className="btn btn-ghost" href="/stellazh">
          Стеллаж
        </Link>
      </div>
      <p className="hint">
        База {cell.min} {cell.unit} · сейчас {demand.label}: цель {target}{" "}
        {cell.unit}
      </p>
      <div className="qty-box">
        <p className="qty-label">Учёт</p>
        <p className="qty-value">
          {cell.qty}
          <span style={{ fontSize: 18, marginLeft: 8 }}>{cell.unit}</span>
        </p>
      </div>
      <p className="qty-label">Факт</p>
      <div className="stepper">
        <button
          type="button"
          onClick={() => setDraft(Math.max(0, qty - 1))}
          aria-label="Меньше"
        >
          −
        </button>
        <output>
          {qty} {cell.unit}
        </output>
        <button
          type="button"
          onClick={() => setDraft(qty + 1)}
          aria-label="Больше"
        >
          +
        </button>
      </div>
      <button
        className="btn"
        type="button"
        onClick={() => {
          setQty(cell.id, qty);
          router.push("/stellazh");
        }}
      >
        Сохранить
      </button>
    </>
  );
}
