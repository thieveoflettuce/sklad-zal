"use client";

import Link from "next/link";
import { useState } from "react";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { docStamp } from "@/lib/document-export";
import { useStore } from "@/lib/store";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReceiptPage() {
  const { filledCells, receiveQty, receipts } = useStore();
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [justSaved, setJustSaved] = useState<string | null>(null);

  function draftFor(id: string) {
    return drafts[id] ?? 1;
  }

  function setDraft(id: string, value: number) {
    setDrafts((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  }

  function accept(cellId: string) {
    const amount = draftFor(cellId);
    if (amount <= 0) return;
    receiveQty(cellId, amount);
    setDraft(cellId, 1);
    setJustSaved(cellId);
    window.setTimeout(() => setJustSaved(null), 1200);
  }

  const recent = receipts.slice(0, 8);

  const exportDoc = {
    filename: `priemka-zal-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: "Приёмка · Зал",
    subtitle: docStamp("Последние поступления"),
    columns: ["Дата", "Товар", "Приехало", "Стало на полке", "Ед."],
    rows: receipts.map((item) => [
      formatWhen(item.at),
      item.name,
      `+${item.amount}`,
      String(item.qtyAfter),
      item.unit,
    ]),
    emptyText: "Приёмок пока не было.",
  };

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Приёмка</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        Что приехало — укажи количество и нажми «Принять». Остаток на полке
        увеличится.
      </p>
      {receipts.length > 0 && <ExportPdfButton doc={exportDoc} />}

      <div className="receive-list">
        {filledCells().map((cell, i) => {
          const draft = draftFor(cell.id);
          const saved = justSaved === cell.id;
          return (
            <article
              key={cell.id}
              className="receive-card"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="receive-head">
                <strong>{cell.name}</strong>
                <span className="receive-now">
                  на полке {cell.qty} {cell.unit}
                </span>
              </div>
              <p className="receive-label">Приехало</p>
              <div className="stepper receive-stepper">
                <button
                  type="button"
                  onClick={() => setDraft(cell.id, draft - 1)}
                  aria-label="Меньше"
                >
                  −
                </button>
                <output>
                  {draft} {cell.unit}
                </output>
                <button
                  type="button"
                  onClick={() => setDraft(cell.id, draft + 1)}
                  aria-label="Больше"
                >
                  +
                </button>
              </div>
              <button
                className="btn"
                type="button"
                disabled={draft <= 0}
                onClick={() => accept(cell.id)}
              >
                {saved ? "Принято" : "Принять"}
              </button>
            </article>
          );
        })}
      </div>

      {recent.length > 0 && (
        <>
          <h2 className="receive-section">Последние приёмки</h2>
          {recent.map((item, i) => (
            <div
              key={item.id}
              className="line"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span>
                {item.name}
                <span className="demand-meta" style={{ display: "block" }}>
                  {formatWhen(item.at)}
                </span>
              </span>
              <span>
                +{item.amount} {item.unit}
                <span className="demand-meta" style={{ display: "block" }}>
                  → {item.qtyAfter}
                </span>
              </span>
            </div>
          ))}
        </>
      )}
    </>
  );
}
