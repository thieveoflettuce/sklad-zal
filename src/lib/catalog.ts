import type {
  Demand,
  DemandId,
  ShelfRow,
  StorageKind,
  StorageUnit,
  UsageEvent,
} from "./types";

export const STORAGE_KINDS: { id: StorageKind; label: string }[] = [
  { id: "stellazh", label: "Стеллаж" },
  { id: "shkaf", label: "Шкаф" },
  { id: "polka", label: "Полка" },
];

export const DEMANDS: Demand[] = [
  {
    id: "offseason",
    label: "Межсезонье",
    mult: 0.7,
    hint: "Заказ меньше",
    example: "Осень и весна без событий, тихие недели",
  },
  {
    id: "normal",
    label: "Обычный режим",
    mult: 1,
    hint: "Базовый минимум",
    example: "Стабильная загрузка без сезона и праздников",
  },
  {
    id: "summer",
    label: "Летний сезон",
    mult: 1.3,
    hint: "Выше обычного",
    example: "Терраса, туристы, долгие вечера",
  },
  {
    id: "weekend",
    label: "Выходные",
    mult: 1.4,
    hint: "Запас на пт–вс",
    example: "Пятница–воскресенье, пик зала",
  },
  {
    id: "corporate",
    label: "Корпоративы",
    mult: 1.8,
    hint: "Крупный дозаказ",
    example: "Банкеты, закрытия, большие группы",
  },
  {
    id: "holiday",
    label: "Праздники",
    mult: 2.2,
    hint: "Максимальный запас",
    example: "Новый год, 8 марта, 23 февраля, 14 февраля",
  },
];

const LEGACY_SHELVES: ShelfRow[] = [
  {
    id: "top",
    label: "Полка 1 — верх",
    cells: [
      { id: "1a", name: "Салфетки", qty: 12, unit: "уп", min: 10 },
      { id: "1b", name: "Трубочки", qty: 8, unit: "уп", min: 10 },
      { id: "1c", name: "Зубочистки", qty: 5, unit: "уп", min: 8 },
      { id: "1d", name: "—", qty: null, unit: "", min: 0 },
    ],
  },
  {
    id: "mid",
    label: "Полка 2",
    cells: [
      { id: "2a", name: "Соусники", qty: 24, unit: "шт", min: 15 },
      { id: "2b", name: "Перец", qty: 6, unit: "шт", min: 10 },
      { id: "2c", name: "Соль", qty: 6, unit: "шт", min: 10 },
      { id: "2d", name: "Сахар", qty: 10, unit: "шт", min: 8 },
    ],
  },
  {
    id: "low",
    label: "Полка 3 — низ",
    cells: [
      { id: "3a", name: "Меню", qty: 40, unit: "шт", min: 20 },
      { id: "3b", name: "Подставки", qty: 18, unit: "шт", min: 12 },
      { id: "3c", name: "—", qty: null, unit: "", min: 0 },
      { id: "3d", name: "—", qty: null, unit: "", min: 0 },
    ],
  },
];

export const INITIAL_STORAGE_UNITS: StorageUnit[] = [
  {
    id: "unit-zal-1",
    kind: "stellazh",
    name: "Стеллаж зала",
    rows: LEGACY_SHELVES,
  },
];

/** @deprecated use INITIAL_STORAGE_UNITS */
export const INITIAL_SHELVES = LEGACY_SHELVES;

export const SEED_USAGE: UsageEvent[] = [
  { id: "u1", cellId: "1a", name: "Салфетки", delta: -3, unit: "уп", at: "2026-08-14T10:00:00" },
  { id: "u2", cellId: "2a", name: "Соусники", delta: -8, unit: "шт", at: "2026-08-14T12:00:00" },
  { id: "u3", cellId: "1b", name: "Трубочки", delta: -2, unit: "уп", at: "2026-08-14T14:00:00" },
  { id: "u4", cellId: "1a", name: "Салфетки", delta: -42, unit: "уп", at: "2026-08-01T10:00:00" },
  { id: "u5", cellId: "2a", name: "Соусники", delta: -110, unit: "шт", at: "2026-08-01T10:00:00" },
  { id: "u6", cellId: "2d", name: "Сахар", delta: -28, unit: "шт", at: "2026-08-01T10:00:00" },
  { id: "u7", cellId: "1a", name: "Салфетки", delta: -120, unit: "уп", at: "2026-07-01T10:00:00" },
  { id: "u8", cellId: "2a", name: "Соусники", delta: -310, unit: "шт", at: "2026-07-01T10:00:00" },
  { id: "u9", cellId: "3b", name: "Подставки", delta: -45, unit: "шт", at: "2026-07-01T10:00:00" },
  { id: "u10", cellId: "1a", name: "Салфетки", delta: -480, unit: "уп", at: "2026-01-15T10:00:00" },
  { id: "u11", cellId: "2a", name: "Соусники", delta: -1200, unit: "шт", at: "2026-01-15T10:00:00" },
  { id: "u12", cellId: "1b", name: "Трубочки", delta: -210, unit: "уп", at: "2026-01-15T10:00:00" },
];

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function kindLabel(kind: StorageKind) {
  return STORAGE_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

export function unitLabel(unit: StorageUnit) {
  return `${kindLabel(unit.kind)} · ${unit.name}`;
}

export function allCells(units: StorageUnit[]) {
  return units.flatMap((u) => u.rows.flatMap((r) => r.cells));
}

export function filledCellIdsFromUnits(units: StorageUnit[]) {
  return allCells(units)
    .filter((cell) => cell.qty !== null)
    .map((cell) => cell.id);
}

export function demandById(id: DemandId): Demand {
  return DEMANDS.find((d) => d.id === id) ?? DEMANDS[1];
}

export function filledCellIds() {
  return filledCellIdsFromUnits(INITIAL_STORAGE_UNITS);
}

export function calcOrder(now: number, min: number, mult: number) {
  const target = Math.ceil(min * mult);
  return Math.max(0, target - now);
}

export function calcTarget(min: number, mult: number) {
  return Math.ceil(min * mult);
}

export type StockStatus = "ok" | "warn" | "critical";

export function stockStatus(
  now: number,
  min: number,
  mult: number,
): StockStatus {
  const target = calcTarget(min, mult);
  if (now < target) return "critical";
  const buffer = Math.max(1, Math.ceil(min * 0.3));
  if (now < target + buffer) return "warn";
  return "ok";
}

export function mapUnits(
  units: StorageUnit[],
  cellId: string,
  mapCell: (cell: StorageUnit["rows"][0]["cells"][0]) => StorageUnit["rows"][0]["cells"][0],
): StorageUnit[] {
  return units.map((unit) => ({
    ...unit,
    rows: unit.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) =>
        cell.id === cellId ? mapCell(cell) : cell,
      ),
    })),
  }));
}
