"use client";

import Link from "next/link";
import { calcTarget, demandById } from "@/lib/catalog";
import { useStore } from "@/lib/store";

type Props = {
  hrefFor: (id: string) => string;
  highlightLow?: boolean;
  showCounted?: boolean;
};

export function ShelfGrid({ hrefFor, highlightLow, showCounted }: Props) {
  const { shelves, demandId, counted } = useStore();
  const demand = demandById(demandId);

  return (
    <div className="rack">
      {shelves.map((row, rowIndex) => (
        <section
          key={row.id}
          className="rack-row"
          style={{ animationDelay: `${rowIndex * 80}ms` }}
        >
          <p className="rack-label">{row.label}</p>
          <div className="rack-board">
            {row.cells.map((cell) => {
              const empty = cell.qty === null;
              const target = calcTarget(cell.min, demand.mult);
              const low = !empty && (cell.qty as number) < target;
              const done = counted.includes(cell.id);
              const className = [
                "bin",
                empty ? "is-empty" : "",
                highlightLow && low ? "is-low" : "",
                showCounted && done ? "is-counted" : "",
              ]
                .filter(Boolean)
                .join(" ");

              if (empty) {
                return (
                  <div key={cell.id} className={className} aria-hidden>
                    <span className="bin-name">пусто</span>
                  </div>
                );
              }

              return (
                <Link key={cell.id} href={hrefFor(cell.id)} className={className}>
                  <span className="bin-name">{cell.name}</span>
                  <span className="bin-qty">
                    {cell.qty} {cell.unit}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
