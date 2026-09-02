export type ExportDocument = {
  filename: string;
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
  emptyText?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTableMarkup(doc: ExportDocument) {
  const head = doc.columns
    .map((col) => `<th>${escapeHtml(col)}</th>`)
    .join("");

  const body =
    doc.rows.length === 0
      ? `<tr><td colspan="${doc.columns.length}">${escapeHtml(doc.emptyText ?? "Нет данных")}</td></tr>`
      : doc.rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
          )
          .join("");

  const subtitle = doc.subtitle
    ? `<p style="margin:0 0 18px;color:#4d6356;font-size:13px;">${escapeHtml(doc.subtitle)}</p>`
    : "";

  return `
    <h1 style="margin:0 0 6px;font-size:22px;">${escapeHtml(doc.title)}</h1>
    ${subtitle}
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    <p style="margin:18px 0 0;font-size:11px;color:#4d6356;">
      SKLAD · Зал · ${escapeHtml(new Date().toLocaleString("ru-RU"))}
    </p>
  `;
}

const tableStyles = `
  th, td {
    border: 1px solid #b8c5bb;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #e7efe4;
    font-weight: 700;
  }
  tr:nth-child(even) td {
    background: #f7faf6;
  }
`;

function buildPrintHtml(doc: ExportDocument) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: Arial, sans-serif;
      color: #14241c;
    }
    ${tableStyles}
    @media print {
      body { padding: 12px; }
    }
  </style>
</head>
<body>${buildTableMarkup(doc)}</body>
</html>`;
}

export function printDocument(doc: ExportDocument) {
  const html = buildPrintHtml(doc);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    window.alert("Разреши всплывающие окна для печати.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}

export async function downloadDocumentPdf(doc: ExportDocument) {
  const html2pdf = (await import("html2pdf.js")).default;
  const wrapper = document.createElement("div");
  wrapper.style.width = "794px";
  wrapper.style.background = "#fff";
  wrapper.style.padding = "24px";
  wrapper.style.fontFamily = "Arial, sans-serif";
  wrapper.style.color = "#14241c";
  wrapper.innerHTML = buildTableMarkup(doc);

  for (const cell of wrapper.querySelectorAll("th, td")) {
    const el = cell as HTMLElement;
    el.style.border = "1px solid #b8c5bb";
    el.style.padding = "8px 10px";
  }
  for (const th of wrapper.querySelectorAll("th")) {
    (th as HTMLElement).style.background = "#e7efe4";
  }

  document.body.appendChild(wrapper);

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: doc.filename.endsWith(".pdf") ? doc.filename : `${doc.filename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

export function docStamp(extra?: string) {
  const when = new Date().toLocaleString("ru-RU");
  return extra ? `${extra} · ${when}` : when;
}

export function statusLabel(status: "ok" | "warn" | "critical") {
  if (status === "ok") return "Хватает";
  if (status === "warn") return "Скоро кончится";
  return "Пора заказать";
}
