"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { calcTarget, demandById, stockStatus } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { Cell, ShelfRow } from "@/lib/types";

type Props = {
  hrefFor: (id: string) => string;
  showStatus?: boolean;
  draggable?: boolean;
  rows?: ShelfRow[];
};

function statusText(
  status: ReturnType<typeof stockStatus>,
  target: number,
) {
  if (status === "ok") return "хватает";
  if (status === "warn") return "скоро мало";
  return `цель ${target}`;
}

type BinProps = {
  cell: Cell;
  className: string;
  href: string;
  statusLine?: string;
  draggable: boolean;
  draggingId: string | null;
  overId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (id: string) => void;
  onDrop: (toId: string, fromId: string) => void;
  onTouchStart: (id: string, e: ReactTouchEvent) => void;
};

function CellBin({
  cell,
  className,
  href,
  statusLine,
  draggable,
  draggingId,
  overId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
}: BinProps) {
  const router = useRouter();
  const didDrag = useRef(false);
  const empty = cell.qty === null;

  const binClass = [
    className,
    draggingId === cell.id ? "is-dragging" : "",
    overId === cell.id && draggingId !== cell.id ? "is-drop-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="bin-name">{empty ? "пусто" : cell.name}</span>
      {!empty && (
        <>
          <span className="bin-qty">
            {cell.qty} {cell.unit}
          </span>
          {statusLine && <span className="bin-status">{statusLine}</span>}
        </>
      )}
    </>
  );

  if (!draggable) {
    if (empty) {
      return (
        <div className={binClass} data-cell-id={cell.id}>
          {content}
        </div>
      );
    }
    return (
      <a href={href} className={binClass} data-cell-id={cell.id}>
        {content}
      </a>
    );
  }

  return (
    <div
      role="button"
      tabIndex={empty ? -1 : 0}
      data-cell-id={cell.id}
      className={binClass}
      draggable={!empty}
      onDragStart={(e: DragEvent) => {
        if (empty) return;
        didDrag.current = true;
        e.dataTransfer.setData("text/plain", cell.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(cell.id);
      }}
      onDragEnd={() => {
        onDragEnd();
        window.setTimeout(() => {
          didDrag.current = false;
        }, 0);
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(cell.id);
      }}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        if (fromId) onDrop(cell.id, fromId);
        onDragEnd();
      }}
      onTouchStart={(e) => onTouchStart(cell.id, e)}
      onClick={() => {
        if (didDrag.current || empty) return;
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !empty) router.push(href);
      }}
    >
      {content}
    </div>
  );
}

export function ShelfGrid({
  hrefFor,
  showStatus = false,
  draggable = false,
  rows,
}: Props) {
  const { activeUnit, demandId, moveProduct } = useStore();
  const demand = demandById(demandId);
  const shelfRows = rows ?? activeUnit()?.rows ?? [];

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const touchFrom = useRef<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const overIdRef = useRef<string | null>(null);

  const finishDrag = useCallback(() => {
    setDraggingId(null);
    setOverId(null);
    overIdRef.current = null;
    touchFrom.current = null;
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const cellUnderTouch = useCallback((e: ReactTouchEvent | globalThis.TouchEvent) => {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (!t) return null;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    return el?.closest("[data-cell-id]")?.getAttribute("data-cell-id") ?? null;
  }, []);

  const handleDrop = useCallback(
    (toId: string, fromId: string) => {
      if (fromId && toId && fromId !== toId) moveProduct(fromId, toId);
      finishDrag();
    },
    [finishDrag, moveProduct],
  );

  const handleTouchStart = useCallback(
    (cellId: string, e: ReactTouchEvent) => {
      const cell = shelfRows
        .flatMap((r) => r.cells)
        .find((c) => c.id === cellId);
      if (!cell || cell.qty === null) return;

      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
      const startX = e.touches[0]?.clientX ?? 0;
      const startY = e.touches[0]?.clientY ?? 0;

      longPressTimer.current = window.setTimeout(() => {
        touchFrom.current = cellId;
        setDraggingId(cellId);
        if (navigator.vibrate) navigator.vibrate(20);
      }, 380);

      const cancelOnMove = (ev: globalThis.TouchEvent) => {
        const t = ev.touches[0];
        if (!t || touchFrom.current) return;
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);
        if (dx > 8 || dy > 8) {
          if (longPressTimer.current) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
        if (touchFrom.current) {
          ev.preventDefault();
          const id = cellUnderTouch(ev);
          overIdRef.current = id;
          setOverId(id);
        }
      };

      const endTouch = (ev: globalThis.TouchEvent) => {
        document.removeEventListener("touchmove", cancelOnMove);
        document.removeEventListener("touchend", endTouch);
        document.removeEventListener("touchcancel", endTouch);

        if (longPressTimer.current) {
          window.clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (touchFrom.current) {
          const toId = cellUnderTouch(ev) ?? overIdRef.current;
          if (toId) handleDrop(toId, touchFrom.current);
          else finishDrag();
        }
      };

      document.addEventListener("touchmove", cancelOnMove, { passive: false });
      document.addEventListener("touchend", endTouch);
      document.addEventListener("touchcancel", endTouch);
    },
    [cellUnderTouch, finishDrag, handleDrop, shelfRows],
  );

  const setOver = useCallback((id: string) => {
    overIdRef.current = id;
    setOverId(id);
  }, []);

  return (
    <div className={draggable ? "rack is-draggable" : "rack"}>
      {shelfRows.map((row, rowIndex) => (
        <section
          key={row.id}
          className="rack-row"
          style={{ animationDelay: `${rowIndex * 80}ms` }}
        >
          <p className="rack-label">{row.label}</p>
          <div className="rack-board">
            {row.cells.length === 0 ? (
              <p className="rack-empty">Нет ячеек — добавь в настройке склада</p>
            ) : (
              row.cells.map((cell) => {
                const empty = cell.qty === null;
                const qty = cell.qty as number;
                const status = showStatus
                  ? stockStatus(qty, cell.min, demand.mult)
                  : null;
                const className = [
                  "bin",
                  empty ? "is-empty" : "",
                  status ? `is-${status}` : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <CellBin
                    key={cell.id}
                    cell={cell}
                    className={className}
                    href={hrefFor(cell.id)}
                    statusLine={
                      showStatus && status
                        ? statusText(status, calcTarget(cell.min, demand.mult))
                        : undefined
                    }
                    draggable={draggable}
                    draggingId={draggingId}
                    overId={overId}
                    onDragStart={setDraggingId}
                    onDragEnd={finishDrag}
                    onDragOver={setOver}
                    onDrop={handleDrop}
                    onTouchStart={handleTouchStart}
                  />
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
