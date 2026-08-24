"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { INITIAL_SHELVES, SEED_USAGE } from "./catalog";
import type { Cell, DemandId, ShelfRow, UsageEvent } from "./types";

const STORAGE_KEY = "sklad-zal-v1";

type Store = {
  shelves: ShelfRow[];
  demandId: DemandId;
  counted: string[];
  usage: UsageEvent[];
  ready: boolean;
  setDemandId: (id: DemandId) => void;
  setQty: (cellId: string, qty: number) => void;
  markCounted: (cellId: string) => void;
  resetInventory: () => void;
  cellById: (id: string) => Cell | undefined;
  filledCells: () => Cell[];
};

const StoreContext = createContext<Store | null>(null);

type Persisted = {
  shelves: ShelfRow[];
  demandId: DemandId;
  counted: string[];
  usage: UsageEvent[];
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [shelves, setShelves] = useState<ShelfRow[]>(INITIAL_SHELVES);
  const [demandId, setDemandIdState] = useState<DemandId>("summer");
  const [counted, setCounted] = useState<string[]>([]);
  const [usage, setUsage] = useState<UsageEvent[]>(SEED_USAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        if (parsed.shelves) setShelves(parsed.shelves);
        if (parsed.demandId) setDemandIdState(parsed.demandId);
        if (parsed.counted) setCounted(parsed.counted);
        if (parsed.usage) setUsage(parsed.usage);
      }
    } catch {
      /* ignore broken cache */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: Persisted = { shelves, demandId, counted, usage };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, shelves, demandId, counted, usage]);

  function cellById(id: string) {
    return shelves.flatMap((s) => s.cells).find((c) => c.id === id);
  }

  function filledCells() {
    return shelves.flatMap((s) => s.cells).filter((c) => c.qty !== null);
  }

  function setDemandId(id: DemandId) {
    setDemandIdState(id);
  }

  function setQty(cellId: string, qty: number) {
    const prev = cellById(cellId);
    setShelves((rows) =>
      rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          cell.id === cellId ? { ...cell, qty } : cell,
        ),
      })),
    );
    if (prev && prev.qty !== null && qty < prev.qty) {
      setUsage((events) => [
        {
          id: `${Date.now()}`,
          cellId,
          name: prev.name,
          delta: qty - prev.qty,
          unit: prev.unit,
          at: new Date().toISOString(),
        },
        ...events,
      ]);
    }
    setCounted((ids) => (ids.includes(cellId) ? ids : [...ids, cellId]));
  }

  function markCounted(cellId: string) {
    setCounted((ids) => (ids.includes(cellId) ? ids : [...ids, cellId]));
  }

  function resetInventory() {
    setCounted([]);
  }

  const value: Store = {
    shelves,
    demandId,
    counted,
    usage,
    ready,
    setDemandId,
    setQty,
    markCounted,
    resetInventory,
    cellById,
    filledCells,
  };

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const store = use(StoreContext);
  if (!store) throw new Error("StoreProvider missing");
  return store;
}
