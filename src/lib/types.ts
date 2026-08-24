export type DemandId =
  | "offseason"
  | "normal"
  | "summer"
  | "weekend"
  | "corporate"
  | "holiday";

export type ReportPeriod = "day" | "month" | "quarter" | "year";

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

export type UsageEvent = {
  id: string;
  cellId: string;
  name: string;
  delta: number;
  unit: string;
  at: string;
};

export type Demand = {
  id: DemandId;
  label: string;
  mult: number;
  hint: string;
  example: string;
};
