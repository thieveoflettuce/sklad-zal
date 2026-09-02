"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import {
  kindLabel,
  STORAGE_KINDS,
  unitLabel,
} from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { NewProduct, StorageKind } from "@/lib/types";

function emptyProduct(): NewProduct {
  return { name: "", qty: 0, unit: "шт", min: 1 };
}

function CellEditor({
  cellId,
  filled,
}: {
  cellId: string;
  filled: boolean;
}) {
  const { cellById, assignProduct, updateProduct, clearCell } = useStore();
  const cell = cellById(cellId);
  const [open, setOpen] = useState(!filled);
  const [form, setForm] = useState<NewProduct>(() =>
    filled && cell && cell.qty !== null
      ? {
          name: cell.name,
          qty: cell.qty,
          unit: cell.unit,
          min: cell.min,
        }
      : emptyProduct(),
  );

  if (!cell) return null;

  function save() {
    if (filled) updateProduct(cellId, form);
    else assignProduct(cellId, form);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="editor-cell is-filled">
        <div>
          <strong>{cell.name}</strong>
          <p className="demand-meta">
            {cell.qty} {cell.unit} · мин {cell.min}
          </p>
        </div>
        <div className="editor-cell-actions">
          <button className="btn btn-line" type="button" onClick={() => setOpen(true)}>
            Изменить
          </button>
          <button className="btn btn-line" type="button" onClick={() => clearCell(cellId)}>
            Убрать
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-cell">
      <label className="field">
        <span>Название</span>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Салфетки"
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Кол-во</span>
          <input
            type="number"
            min={0}
            value={form.qty}
            onChange={(e) =>
              setForm({ ...form, qty: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label className="field">
          <span>Ед.</span>
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="шт"
          />
        </label>
        <label className="field">
          <span>Мин.</span>
          <input
            type="number"
            min={0}
            value={form.min}
            onChange={(e) =>
              setForm({ ...form, min: Number(e.target.value) || 0 })
            }
          />
        </label>
      </div>
      <div className="editor-cell-actions">
        <button className="btn" type="button" onClick={save}>
          {filled ? "Сохранить" : "Добавить товар"}
        </button>
        {filled && (
          <button className="btn btn-line" type="button" onClick={() => setOpen(false)}>
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}

function SkladEditorContent() {
  const {
    storageUnits,
    activeUnitId,
    setActiveUnitId,
    addStorageUnit,
    updateStorageUnit,
    addRow,
    updateRowLabel,
    addCellSlot,
    activeUnit,
  } = useStore();

  const [newKind, setNewKind] = useState<StorageKind>("stellazh");
  const [newName, setNewName] = useState("");
  const [newRowLabel, setNewRowLabel] = useState("");

  const unit = activeUnit();

  return (
    <>
      <div className="page-head">
        <h1 className="h1">Склад</h1>
        <Link className="btn btn-ghost" href="/">
          Назад
        </Link>
      </div>
      <p className="hint">
        Создай стеллаж, шкаф или полку. Добавь ряды и расставь товары по ячейкам.
      </p>

      <section className="editor-block">
        <h2 className="editor-title">Новое место хранения</h2>
        <div className="periods">
          {STORAGE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={newKind === k.id ? "chip is-on" : "chip"}
              onClick={() => setNewKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Название</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Например: Стеллаж у входа"
          />
        </label>
        <button
          className="btn"
          type="button"
          onClick={() => {
            addStorageUnit(newKind, newName);
            setNewName("");
          }}
        >
          Создать {kindLabel(newKind).toLowerCase()}
        </button>
      </section>

      <section className="editor-block">
        <h2 className="editor-title">Места в зале</h2>
        <div className="unit-tabs">
          {storageUnits.map((u) => (
            <button
              key={u.id}
              type="button"
              className={u.id === activeUnitId ? "unit-tab is-on" : "unit-tab"}
              onClick={() => setActiveUnitId(u.id)}
            >
              {unitLabel(u)}
            </button>
          ))}
        </div>
      </section>

      {unit && (
        <section className="editor-block">
          <h2 className="editor-title">Редактирование</h2>
          <label className="field">
            <span>Тип</span>
            <select
              value={unit.kind}
              onChange={(e) =>
                updateStorageUnit(unit.id, {
                  kind: e.target.value as StorageKind,
                })
              }
            >
              {STORAGE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Название</span>
            <input
              value={unit.name}
              onChange={(e) =>
                updateStorageUnit(unit.id, { name: e.target.value })
              }
            />
          </label>

          {unit.rows.map((row) => (
            <article key={row.id} className="editor-row">
              <label className="field">
                <span>Ряд / полка</span>
                <input
                  value={row.label}
                  onChange={(e) =>
                    updateRowLabel(unit.id, row.id, e.target.value)
                  }
                />
              </label>
              <div className="editor-cells">
                {row.cells.map((cell) => (
                  <CellEditor
                    key={cell.id}
                    cellId={cell.id}
                    filled={cell.qty !== null}
                  />
                ))}
              </div>
              <button
                className="btn btn-line"
                type="button"
                onClick={() => addCellSlot(unit.id, row.id)}
              >
                + Ячейка
              </button>
            </article>
          ))}

          <div className="field-row" style={{ marginTop: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Новый ряд</span>
              <input
                value={newRowLabel}
                onChange={(e) => setNewRowLabel(e.target.value)}
                placeholder="Полка 4 — низ"
              />
            </label>
            <button
              className="btn btn-line"
              type="button"
              style={{ alignSelf: "end" }}
              onClick={() => {
                addRow(unit.id, newRowLabel || `Полка ${unit.rows.length + 1}`);
                setNewRowLabel("");
              }}
            >
              + Ряд
            </button>
          </div>

          <Link className="btn" href="/balans" style={{ marginTop: 16, display: "block" }}>
            Смотреть в балансе
          </Link>
        </section>
      )}
    </>
  );
}

export default function SkladPage() {
  return (
    <Suspense fallback={<p className="hint">Загрузка…</p>}>
      <SkladEditorContent />
    </Suspense>
  );
}
