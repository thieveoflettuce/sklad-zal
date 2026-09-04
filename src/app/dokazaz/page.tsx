"use client";

import Link from "next/link";
import { useState } from "react";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { calcOrder, calcTarget, demandById } from "@/lib/catalog";
import { docStamp } from "@/lib/document-export";
import { useStore } from "@/lib/store";
import type { StorageUnit } from "@/lib/types";

type OrderQty = Record<string, number>;

function buildSuggestedBasket(storageUnits: StorageUnit[], mult: number): OrderQty {
  const initial: OrderQty = {};
  for (const unit of storageUnits) {
    for (const row of unit.rows) {
      for (const cell of row.cells) {
        if (cell.qty === null) continue;
        const qty = calcOrder(cell.qty, cell.min, mult);
        if (qty > 0) initial[cell.id] = qty;
      }
    }
  }
  return initial;
}

export default function ReorderPage() {
  const [sent, setSent] = useState(false);
  const [custom, setCustom] = useState<OrderQty | null>(null);
  const [pickId, setPickId] = useState("");
  const { filledCells, demandId, storageUnits } = useStore();
  const demand = demandById(demandId);
  const cells = filledCells();

  const withMeta = cells.map((cell) => ({
    ...cell,
    suggested: calcOrder(cell.qty as number, cell.min, demand.mult),
    target: calcTarget(cell.min, demand.mult),
  }));

  const suggestedBasket = buildSuggestedBasket(storageUnits, demand.mult);
  const orderQty = custom ?? suggestedBasket;
  const basket = withMeta.filter((cell) => orderQty[cell.id] !== undefined);
  const available = withMeta.filter((cell) => orderQty[cell.id] === undefined);
  const suggestedExtra = available.filter((cell) => cell.suggested > 0);

  function touch(next: OrderQty) {
    setCustom(next);
    setSent(false);
  }

  function setLineQty(id: string, qty: number) {
    touch({ ...orderQty, [id]: Math.max(0, qty) });
  }

  function addToOrder(id: string, fallback = 1) {
    const cell = withMeta.find((item) => item.id === id);
    if (!cell) return;
    touch({
      ...orderQty,
      [id]: orderQty[id] ?? Math.max(fallback, cell.suggested || 1),
    });
  }

  function removeFromOrder(id: string) {
    const next = { ...orderQty };
    delete next[id];
    touch(next);
  }

  function fillSuggested() {
    setCustom(null);
    setSent(false);
  }

  function addPicked() {
    if (!pickId) return;
    addToOrder(pickId);
    setPickId("");
  }

  const exportRows = basket
    .filter((line) => (orderQty[line.id] ?? 0) > 0)
    .map((line) => [
      line.name,
      String(line.qty),
      String(line.target),
      `+${orderQty[line.id]}`,
      line.unit,
    ]);

  const exportDoc = {
    filename: `dokazaz-zal-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: "Дозаказ · Зал",
    subtitle: docStamp(`${demand.label} ×${demand.mult}`),
    columns: ["Товар", "Сейчас", "Цель", "Заказать", "Ед."],
    rows: exportRows,
    emptyText: "В заказе нет позиций — добавь товар вручную.",
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
        {demand.label} ×{demand.mult}. Собирай заказ выборочно: правь количество,
        убирай лишнее или добавляй отдельный товар со склада.
      </p>

      <div className="order-toolbar">
        <button className="btn btn-line" type="button" onClick={fillSuggested}>
          По рекомендации
        </button>
        {basket.length > 0 && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => touch({})}
          >
            Очистить
          </button>
        )}
      </div>

      <h2 className="receive-section">В заказе · {basket.length}</h2>
      {basket.length === 0 ? (
        <p className="hint">Пока пусто — добавь нужный товар ниже.</p>
      ) : (
        <div className="receive-list">
          {basket.map((line, i) => {
            const qty = orderQty[line.id] ?? 0;
            return (
              <article
                key={line.id}
                className="receive-card"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="receive-head">
                  <strong>{line.name}</strong>
                  <span className="receive-now">
                    на полке {line.qty} · цель {line.target}
                  </span>
                </div>
                <p className="receive-label">Заказать</p>
                <div className="stepper receive-stepper">
                  <button
                    type="button"
                    onClick={() => setLineQty(line.id, qty - 1)}
                    aria-label="Меньше"
                  >
                    −
                  </button>
                  <output>
                    {qty} {line.unit}
                  </output>
                  <button
                    type="button"
                    onClick={() => setLineQty(line.id, qty + 1)}
                    aria-label="Больше"
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn btn-line"
                  type="button"
                  onClick={() => removeFromOrder(line.id)}
                >
                  Убрать из заказа
                </button>
              </article>
            );
          })}
        </div>
      )}

      <h2 className="receive-section">Добавить товар</h2>
      {available.length === 0 ? (
        <p className="hint">Все товары со склада уже в заказе.</p>
      ) : (
        <div className="order-add">
          <label className="field">
            <span>Товар со склада</span>
            <select
              value={pickId}
              onChange={(e) => setPickId(e.target.value)}
            >
              <option value="">Выбери товар…</option>
              {available.map((cell) => (
                <option key={cell.id} value={cell.id}>
                  {cell.name}
                  {cell.suggested > 0
                    ? ` · нужно +${cell.suggested}`
                    : ` · сейчас ${cell.qty} ${cell.unit}`}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn"
            type="button"
            disabled={!pickId}
            onClick={addPicked}
          >
            Добавить в заказ
          </button>
        </div>
      )}

      {suggestedExtra.length > 0 && (
        <>
          <h2 className="receive-section">Рекомендуем ещё</h2>
          <p className="hint">Ниже цели периода — добавь по одной позиции.</p>
          {suggestedExtra.map((line, i) => (
            <div
              key={line.id}
              className="line order-suggest"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div>
                <strong>{line.name}</strong>
                <div className="demand-meta">
                  Сейчас {line.qty} · цель {line.target} · +{line.suggested}{" "}
                  {line.unit}
                </div>
              </div>
              <button
                className="btn btn-line order-add-one"
                type="button"
                onClick={() => addToOrder(line.id, line.suggested)}
              >
                В заказ
              </button>
            </div>
          ))}
        </>
      )}

      <div className="stack" style={{ marginTop: 18 }}>
        <ExportPdfButton doc={exportDoc} disabled={exportRows.length === 0} />
        <Link className="btn btn-line" href="/periody">
          Сменить период
        </Link>
        <button
          className="btn"
          type="button"
          disabled={exportRows.length === 0}
          onClick={() => setSent(true)}
        >
          {sent
            ? "Заказ сохранён"
            : exportRows.length === 0
              ? "Добавь товар"
              : `Подтвердить · ${exportRows.length}`}
        </button>
      </div>
    </>
  );
}
