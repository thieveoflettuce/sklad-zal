"use client";

import { useState } from "react";
import {
  downloadDocumentPdf,
  printDocument,
  type ExportDocument,
} from "@/lib/document-export";

type Props = {
  doc: ExportDocument;
  disabled?: boolean;
};

export function ExportPdfButton({ doc, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function onPdf() {
    if (disabled || busy) return;
    setBusy(true);
    try {
      await downloadDocumentPdf(doc);
    } catch {
      window.alert("Не удалось сохранить PDF. Попробуй «Печать».");
    } finally {
      setBusy(false);
    }
  }

  function onPrint() {
    if (disabled || busy) return;
    printDocument(doc);
  }

  return (
    <div className="export-actions">
      <button
        className="btn btn-line"
        type="button"
        disabled={disabled || busy}
        onClick={onPdf}
      >
        {busy ? "PDF…" : "Скачать PDF"}
      </button>
      <button
        className="btn btn-line"
        type="button"
        disabled={disabled || busy}
        onClick={onPrint}
      >
        Печать
      </button>
    </div>
  );
}
