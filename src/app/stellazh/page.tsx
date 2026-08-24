"use client";

import Link from "next/link";
import { ShelfGrid } from "@/components/ShelfGrid";

export default function StellazhPage() {
  return (
    <>
      <div className="page-head">
        <h1 className="h1">Стеллаж</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">Как на полке в зале: сверху вниз, слева направо.</p>
      <ShelfGrid hrefFor={(id) => `/yacheyka/${id}`} />
    </>
  );
}
