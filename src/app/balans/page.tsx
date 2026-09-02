"use client";

import Link from "next/link";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ShelfGrid } from "@/components/ShelfGrid";
import {
  calcTarget,
  demandById,
  kindLabel,
  stockStatus,
  unitLabel,
} from "@/lib/catalog";
import { docStamp, statusLabel } from "@/lib/document-export";
import { useStore } from "@/lib/store";

export default function BalancePage() {
  const { demandId, storageUnits, activeUnitId, setActiveUnitId, activeUnit } =
    useStore();
  const demand = demandById(demandId);
  const unit = activeUnit();

  const unitCells = unit
    ? unit.rows.flatMap((r) => r.cells).filter((c) => c.qty !== null)
    : [];

  const exportDoc = {
    filename: `balans-zal-${new Date().toISOString().slice(0, 10)}.pdf`,
    title: unit ? `Баланс · ${unitLabel(unit)}` : "Баланс · Зал",
    subtitle: docStamp(`${demand.label} ×${demand.mult}`),
    columns: ["Товар", "На полке", "Ед.", "Статус", "Цель"],
    rows: unitCells.map((cell) => {
      const qty = cell.qty as number;
      const status = stockStatus(qty, cell.min, demand.mult);
      return [
        cell.name,
        String(qty),
        cell.unit,
        statusLabel(status),
        String(calcTarget(cell.min, demand.mult)),
      ];
    }),
  };

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Баланс</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        Остатки как на полке. Удерживай товар и перетащи в другую ячейку — на
        телефоне зажми ~0.5 сек. Тап — открыть пересчёт.
      </p>

      {storageUnits.length > 1 && (
        <div className="unit-tabs">
          {storageUnits.map((u) => (
            <button
              key={u.id}
              type="button"
              className={u.id === activeUnitId ? "unit-tab is-on" : "unit-tab"}
              onClick={() => setActiveUnitId(u.id)}
            >
              {kindLabel(u.kind)} · {u.name}
            </button>
          ))}
        </div>
      )}

      {unit && storageUnits.length === 1 && (
        <p className="hint" style={{ marginTop: 0 }}>
          {unitLabel(unit)}
        </p>
      )}

      <ExportPdfButton doc={exportDoc} />
      <div className="balance-legend" aria-label="Легенда цветов">
        <span className="balance-legend-item is-ok">Хватает</span>
        <span className="balance-legend-item is-warn">Скоро кончится</span>
        <span className="balance-legend-item is-critical">Пора заказать</span>
      </div>
      <ShelfGrid
        hrefFor={(id) => `/yacheyka?id=${id}`}
        showStatus
        draggable
        rows={unit?.rows}
      />
      <Link className="btn btn-line" href="/sklad" style={{ marginTop: 16 }}>
        Настройка склада
      </Link>
    </>
  );
}
