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
    const {
      Document,
      PageOrientation,
      Packer,
      Paragraph,
      Table,
      TableCell,
      TableLayoutType,
      TableRow,
      TextRun,
      WidthType,
    } = await import("docx");
    const pageWidth = 15840;
    const pageHeight = 12240;
    const pageMargin = 720;
    const availableTableWidth = pageWidth - pageMargin * 2;
    const columnWeights = columns.map((column) =>
      Math.max(6, Math.min(20, column.length + 2)),
    );
    const totalColumnWeight = columnWeights.reduce(
      (total, weight) => total + weight,
      0,
    );
    const columnWidths = columnWeights.map((weight) =>
      Math.round((availableTableWidth * weight) / totalColumnWeight),
    );
    columnWidths[columnWidths.length - 1] +=
      availableTableWidth -
      columnWidths.reduce((total, width) => total + width, 0);

    const tableRows = matrix.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (value) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: value,
                        bold: rowIndex === 0,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    );
    const document = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: pageWidth,
                height: pageHeight,
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: pageMargin,
                right: pageMargin,
                bottom: pageMargin,
                left: pageMargin,
              },
            },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: filename, bold: true, size: 30 })],
            }),
            new Table({
              rows: tableRows,
              width: { size: availableTableWidth, type: WidthType.DXA },
              columnWidths,
              layout: TableLayoutType.FIXED,
              margins: { top: 80, right: 100, bottom: 80, left: 100 },
            }),
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
