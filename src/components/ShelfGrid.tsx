"use client";

import Link from "next/link";
import { calcTarget, demandById, stockStatus } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { ShelfRow } from "@/lib/types";

type Props = {
  hrefFor: (id: string) => string;
  showStatus?: boolean;
  rows?: ShelfRow[];
};

export function ShelfGrid({ hrefFor, showStatus, rows }: Props) {
  const { activeUnit, demandId } = useStore();
  const demand = demandById(demandId);
  const shelfRows = rows ?? activeUnit()?.rows ?? [];

  return (
    <div className="rack">
      {shelfRows.map((row, rowIndex) => (
        <section
          key={row.id}
          className="rack-row"
          style={{ animationDelay: `${rowIndex * 80}ms` }}
        >
          <p className="rack-label">{row.label}</p>
          <div className="rack-board">
            {row.cells.length === 0 ? (
              <p className="rack-empty">Нет ячеек — добавь в настройке склада</p>
            ) : (
              row.cells.map((cell) => {
                const empty = cell.qty === null;
                const qty = cell.qty as number;
                const status = showStatus
                  ? stockStatus(qty, cell.min, demand.mult)
                  : null;
                const className = [
                  "bin",
                  empty ? "is-empty" : "",
                  status ? `is-${status}` : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                if (empty) {
                  return (
                    <div key={cell.id} className={className}>
                      <span className="bin-name">пусто</span>
                    </div>
                  );
                }

                const target = calcTarget(cell.min, demand.mult);

                return (
                  <Link key={cell.id} href={hrefFor(cell.id)} className={className}>
                    <span className="bin-name">{cell.name}</span>
                    <span className="bin-qty">
                      {cell.qty} {cell.unit}
                    </span>
                    {showStatus && (
                      <span className="bin-status">
                        {status === "ok" && "хватает"}
                        {status === "warn" && "скоро мало"}
                        {status === "critical" && `цель ${target}`}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
