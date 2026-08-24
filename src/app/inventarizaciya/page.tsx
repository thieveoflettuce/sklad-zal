"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShelfGrid } from "@/components/ShelfGrid";
import { calcOrder, demandById } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export default function InventoryPage() {
  const router = useRouter();
  const { filledCells, counted, resetInventory, demandId } = useStore();
  const demand = demandById(demandId);
  const total = filledCells().length;
  const low = filledCells().filter(
    (c) => calcOrder(c.qty as number, c.min, demand.mult) > 0,
  ).length;

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Счёт</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        Обход полок сверху вниз. Пересчитано {counted.length} из {total}. Ниже
        цели периода: {low}.
      </p>
      <ShelfGrid
        hrefFor={(id) => `/yacheyka/${id}`}
        highlightLow
        showCounted
      />
      <div className="stack" style={{ marginTop: 16 }}>
        <button
          className="btn"
          type="button"
          onClick={() => router.push("/dokazaz")}
        >
          Завершить → корзина
        </button>
        <button className="btn btn-line" type="button" onClick={resetInventory}>
          Сбросить отметки обхода
        </button>
      </div>
    </>
  );
}
