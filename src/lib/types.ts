export type DemandId =
  | "offseason"
  | "normal"
  | "summer"
  | "weekend"
  | "corporate"
  | "holiday";

export type ReportPeriod = "day" | "month" | "quarter" | "year";

export type StorageKind = "stellazh" | "shkaf" | "polka";

export type Cell = {
  id: string;
  name: string;
  qty: number | null;
  unit: string;
  min: number;
};

export type ShelfRow = {
  id: string;
  label: string;
  cells: Cell[];
};

export type StorageUnit = {
  id: string;
  kind: StorageKind;
  name: string;
  rows: ShelfRow[];
};

export type UsageEvent = {
  id: string;
  cellId: string;
  name: string;
  delta: number;
  unit: string;
  at: string;
};

export type ReceiptEvent = {
  id: string;
  cellId: string;
  name: string;
  amount: number;
  unit: string;
  qtyAfter: number;
  at: string;
};

export type Demand = {
  id: DemandId;
  label: string;
  mult: number;
  hint: string;
  example: string;
};

export type NewProduct = {
  name: string;
  qty: number;
  unit: string;
  min: number;
};
