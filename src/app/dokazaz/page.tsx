"use client";

import Link from "next/link";
import { useState } from "react";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { calcOrder, calcTarget, demandById } from "@/lib/catalog";
import { docStamp } from "@/lib/document-export";
import { useStore } from "@/lib/store";

export default function ReorderPage() {
  const [sent, setSent] = useState(false);
  const { filledCells, demandId } = useStore();
  const demand = demandById(demandId);
  const lines = filledCells()
    .map((cell) => ({
      ...cell,
      order: calcOrder(cell.qty as number, cell.min, demand.mult),
      target: calcTarget(cell.min, demand.mult),
    }))
    .filter((line) => line.order > 0);

  const exportDoc = {
    filename: `dokazaz-zal-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: "Дозаказ · Зал",
    subtitle: docStamp(`${demand.label} ×${demand.mult}`),
    columns: ["Товар", "Сейчас", "Цель", "Заказать", "Ед."],
    rows: lines.map((line) => [
      line.name,
      String(line.qty),
      String(line.target),
      `+${line.order}`,
      line.unit,
    ]),
    emptyText: "Все позиции выше цели периода — заказ не нужен.",
  };

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Дозаказ</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        {demand.label} ×{demand.mult}. Цель = минимум × период. Меняй период —
        корзина пересчитается.
      </p>
      {lines.length === 0 ? (
        <p className="hint">Сейчас всё выше цели периода.</p>
      ) : (
        lines.map((line, i) => (
          <div
            key={line.id}
            className="line"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div>
              <strong>{line.name}</strong>
              <div className="demand-meta">
                Сейчас {line.qty} · база {line.min} · цель {line.target}
              </div>
            </div>
            <strong>
              +{line.order} {line.unit}
            </strong>
          </div>
        ))
      )}
      <div className="stack" style={{ marginTop: 18 }}>
        <ExportPdfButton doc={exportDoc} />
        <Link className="btn btn-line" href="/periody">
          Сменить период
        </Link>
        <button
          className="btn"
          type="button"
          onClick={() => setSent(true)}
        >
          {sent ? "Список сохранён" : "Подтвердить список"}
        </button>
      </div>
    </>
  );
}
