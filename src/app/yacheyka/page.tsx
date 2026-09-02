"use client";

import Link from "next/link";
import { Suspense } from "react";
import CellPage from "./CellPageInner";

export default function YacheykaPage() {
  return (
    <Suspense fallback={<p className="hint">Загрузка…</p>}>
      <CellPage />
    </Suspense>
  );
}
