"use client";

import Link from "next/link";
import { calcOrder, demandById } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { demandId, filledCells } = useStore();
  const demand = demandById(demandId);
  const need = filledCells().filter(
    (c) => calcOrder(c.qty as number, c.min, demand.mult) > 0,
  ).length;

  return (
    <>
      <h1 className="h1">Зал</h1>
      <p className="lead">
        Один стеллаж. Считаешь полки как глазами — заказ собирается сам.
      </p>
      <div className="stack">
        <Link className="btn" href="/stellazh">
          Открыть стеллаж
        </Link>
        <Link className="btn btn-line" href="/inventarizaciya">
          Инвентаризация
        </Link>
        <Link className="btn btn-line" href="/dokazaz">
          Дозаказ · {need} позиций
        </Link>
        <Link className="btn btn-line" href="/periody">
          Период: {demand.label}
        </Link>
        <Link className="btn btn-line" href="/otchety">
          Отчёты использования
        </Link>
        <p className="later">Кухня и бар подключим позже. Админка — тоже.</p>
      </div>
    </>
  );
}
