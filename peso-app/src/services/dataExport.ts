export type ExportFormat = "csv" | "docx" | "xlsx" | "pdf";
export type ExportRow = Record<string, unknown> | unknown[];

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function safeFilename(filename: string, extension: ExportFormat): string {
  return `${filename.replace(/\.[^.]+$/, "")}.${extension}`;
}

function exportMatrix(columns: string[], rows: ExportRow[]): string[][] {
  return [
    columns,
    ...rows.map((row) =>
      Array.isArray(row)
        ? columns.map((_, index) => cellText(row[index]))
        : columns.map((column) => cellText(row[column])),
    ),
  ];
}

function csvCell(value: string): string {
  const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportData(
  filename: string,
  columns: string[],
  rows: ExportRow[],
  format: ExportFormat,
): Promise<void> {
  const matrix = exportMatrix(columns, rows);
  const targetFilename = safeFilename(filename, format);

  if (format === "csv") {
    const csv = matrix
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
      .concat("\r\n");
    downloadBlob(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
      targetFilename,
    );
    return;
  }

  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet(matrix);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Report");
    XLSX.writeFile(workbook, targetFilename);
    return;
  }

  if (format === "docx") {
    const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } =
      await import("docx");
    const tableRows = matrix.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (value) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: value, bold: rowIndex === 0 })],
                  }),
                ],
              }),
          ),
        }),
    );
    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: filename, bold: true, size: 30 })],
            }),
            new Table({ rows: tableRows }),
          ],
        },
      ],
    });
    downloadBlob(await Packer.toBlob(document), targetFilename);
    return;
  }

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const document = new jsPDF({ orientation: "landscape" });
  autoTable(document, {
    head: [matrix[0]],
    body: matrix.slice(1),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [32, 63, 139] },
  });
  document.save(targetFilename);
}
