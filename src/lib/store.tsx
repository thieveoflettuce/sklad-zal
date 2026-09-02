"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_STORAGE_UNITS,
  mapUnits,
  SEED_USAGE,
  uid,
} from "./catalog";
import type {
  Cell,
  DemandId,
  NewProduct,
  ReceiptEvent,
  ShelfRow,
  StorageKind,
  StorageUnit,
  UsageEvent,
} from "./types";

const STORAGE_KEY = "sklad-zal-v2";

type Store = {
  storageUnits: StorageUnit[];
  activeUnitId: string;
  demandId: DemandId;
  usage: UsageEvent[];
  receipts: ReceiptEvent[];
  ready: boolean;
  activeUnit: () => StorageUnit | undefined;
  setDemandId: (id: DemandId) => void;
  setActiveUnitId: (id: string) => void;
  setQty: (cellId: string, qty: number) => void;
  receiveQty: (cellId: string, amount: number) => void;
  cellById: (id: string) => Cell | undefined;
  filledCells: () => Cell[];
  addStorageUnit: (kind: StorageKind, name: string) => void;
  updateStorageUnit: (
    unitId: string,
    patch: { name?: string; kind?: StorageKind },
  ) => void;
  addRow: (unitId: string, label: string) => void;
  updateRowLabel: (unitId: string, rowId: string, label: string) => void;
  addCellSlot: (unitId: string, rowId: string) => void;
  assignProduct: (cellId: string, product: NewProduct) => void;
  updateProduct: (cellId: string, product: NewProduct) => void;
  clearCell: (cellId: string) => void;
  moveProduct: (fromCellId: string, toCellId: string) => void;
};

const StoreContext = createContext<Store | null>(null);

type Persisted = {
  storageUnits?: StorageUnit[];
  shelves?: ShelfRow[];
  activeUnitId?: string;
  demandId: DemandId;
  usage: UsageEvent[];
  receipts?: ReceiptEvent[];
};

function migrateUnits(parsed: Persisted): StorageUnit[] {
  if (parsed.storageUnits?.length) return parsed.storageUnits;
  if (parsed.shelves?.length) {
    return [
      {
        id: "unit-zal-1",
        kind: "stellazh",
        name: "Стеллаж зала",
        rows: parsed.shelves,
      },
    ];
  }
  return INITIAL_STORAGE_UNITS;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>(
    INITIAL_STORAGE_UNITS,
  );
  const [activeUnitId, setActiveUnitIdState] = useState(
    INITIAL_STORAGE_UNITS[0].id,
  );
  const [demandId, setDemandIdState] = useState<DemandId>("summer");
  const [usage, setUsage] = useState<UsageEvent[]>(SEED_USAGE);
  const [receipts, setReceipts] = useState<ReceiptEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("sklad-zal-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        const units = migrateUnits(parsed);
        setStorageUnits(units);
        setActiveUnitIdState(
          parsed.activeUnitId && units.some((u) => u.id === parsed.activeUnitId)
            ? parsed.activeUnitId
            : units[0]?.id ?? INITIAL_STORAGE_UNITS[0].id,
        );
        if (parsed.demandId) setDemandIdState(parsed.demandId);
        if (parsed.usage) setUsage(parsed.usage);
        if (parsed.receipts) setReceipts(parsed.receipts);
      }
    } catch {
      /* ignore broken cache */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: Persisted = {
      storageUnits,
      activeUnitId,
      demandId,
      usage,
      receipts,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, storageUnits, activeUnitId, demandId, usage, receipts]);

  function activeUnit() {
    return storageUnits.find((u) => u.id === activeUnitId) ?? storageUnits[0];
  }

  function cellById(id: string) {
    return storageUnits
      .flatMap((u) => u.rows.flatMap((r) => r.cells))
      .find((c) => c.id === id);
  }

  function filledCells() {
    return storageUnits
      .flatMap((u) => u.rows.flatMap((r) => r.cells))
      .filter((c) => c.qty !== null);
  }

  function setDemandId(id: DemandId) {
    setDemandIdState(id);
  }

  function setActiveUnitId(id: string) {
    setActiveUnitIdState(id);
  }

  function setQty(cellId: string, qty: number) {
    const prev = cellById(cellId);
    setStorageUnits((units) =>
      mapUnits(units, cellId, (cell) => ({ ...cell, qty })),
    );
    if (prev && prev.qty !== null && qty < prev.qty) {
      const prevQty = prev.qty;
      setUsage((events) => [
        {
          id: `${Date.now()}`,
          cellId,
          name: prev.name,
          delta: qty - prevQty,
          unit: prev.unit,
          at: new Date().toISOString(),
        },
        ...events,
      ]);
    }
  }

  function receiveQty(cellId: string, amount: number) {
    if (amount <= 0) return;
    const prev = cellById(cellId);
    if (!prev || prev.qty === null) return;

    const qtyAfter = prev.qty + amount;
    setStorageUnits((units) =>
      mapUnits(units, cellId, (cell) => ({ ...cell, qty: qtyAfter })),
    );
    setReceipts((items) => [
      {
        id: `${Date.now()}-${cellId}`,
        cellId,
        name: prev.name,
        amount,
        unit: prev.unit,
        qtyAfter,
        at: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  function addStorageUnit(kind: StorageKind, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const unit: StorageUnit = {
      id: uid("unit"),
      kind,
      name: trimmed,
      rows: [
        {
          id: uid("row"),
          label: "Полка 1",
          cells: [],
        },
      ],
    };
    setStorageUnits((units) => [...units, unit]);
    setActiveUnitIdState(unit.id);
  }

  function updateStorageUnit(
    unitId: string,
    patch: { name?: string; kind?: StorageKind },
  ) {
    setStorageUnits((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              ...patch,
              name: patch.name?.trim() ? patch.name.trim() : unit.name,
            }
          : unit,
      ),
    );
  }

  function addRow(unitId: string, label: string) {
    const trimmed = label.trim() || `Полка ${Date.now() % 100}`;
    setStorageUnits((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              rows: [
                ...unit.rows,
                { id: uid("row"), label: trimmed, cells: [] },
              ],
            }
          : unit,
      ),
    );
  }

  function updateRowLabel(unitId: string, rowId: string, label: string) {
    setStorageUnits((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              rows: unit.rows.map((row) =>
                row.id === rowId ? { ...row, label: label.trim() || row.label } : row,
              ),
            }
          : unit,
      ),
    );
  }

  function addCellSlot(unitId: string, rowId: string) {
    setStorageUnits((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              rows: unit.rows.map((row) =>
                row.id === rowId
                  ? {
                      ...row,
                      cells: [
                        ...row.cells,
                        {
                          id: uid("cell"),
                          name: "—",
                          qty: null,
                          unit: "",
                          min: 0,
                        },
                      ],
                    }
                  : row,
              ),
            }
          : unit,
      ),
    );
  }

  function assignProduct(cellId: string, product: NewProduct) {
    const name = product.name.trim();
    if (!name) return;
    setStorageUnits((units) =>
      mapUnits(units, cellId, (cell) => ({
        ...cell,
        name,
        qty: product.qty,
        unit: product.unit.trim() || "шт",
        min: product.min,
      })),
    );
  }

  function updateProduct(cellId: string, product: NewProduct) {
    assignProduct(cellId, product);
  }

  function clearCell(cellId: string) {
    setStorageUnits((units) =>
      mapUnits(units, cellId, (cell) => ({
        ...cell,
        name: "—",
        qty: null,
        unit: "",
        min: 0,
      })),
    );
  }

  function moveProduct(fromCellId: string, toCellId: string) {
    if (fromCellId === toCellId) return;
    const from = cellById(fromCellId);
    const to = cellById(toCellId);
    if (!from || from.qty === null) return;

    const fromData = {
      name: from.name,
      qty: from.qty,
      unit: from.unit,
      min: from.min,
    };
    const toData =
      to && to.qty !== null
        ? { name: to.name, qty: to.qty, unit: to.unit, min: to.min }
        : null;

    setStorageUnits((units) =>
      units.map((unit) => ({
        ...unit,
        rows: unit.rows.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => {
            if (cell.id === fromCellId) {
              return toData
                ? { ...cell, ...toData }
                : { ...cell, name: "—", qty: null, unit: "", min: 0 };
            }
            if (cell.id === toCellId) {
              return { ...cell, ...fromData };
            }
            return cell;
          }),
        })),
      })),
    );
  }

  const value: Store = {
    storageUnits,
    activeUnitId,
    demandId,
    usage,
    receipts,
    ready,
    activeUnit,
    setDemandId,
    setActiveUnitId,
    setQty,
    receiveQty,
    cellById,
    filledCells,
    addStorageUnit,
    updateStorageUnit,
    addRow,
    updateRowLabel,
    addCellSlot,
    assignProduct,
    updateProduct,
    clearCell,
    moveProduct,
  };

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const store = use(StoreContext);
  if (!store) throw new Error("StoreProvider missing");
  return store;
}
