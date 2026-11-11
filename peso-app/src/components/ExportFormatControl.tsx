import { useState } from "react";
import {
  exportData,
  type ExportFormat,
  type ExportRow,
} from "../services/dataExport";

type Props = {
  filename: string;
  columns: string[];
  rows: ExportRow[];
  buttonLabel?: string;
};

const formats: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "docx", label: "Word (.docx)" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "pdf", label: "PDF" },
];

export default function ExportFormatControl({
  filename,
  columns,
  rows,
  buttonLabel = "Export",
}: Props) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      await exportData(filename, columns, rows, format);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export this data.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && (
        <p role="alert" className="w-full text-right text-xs text-red-700">
          {error}
        </p>
      )}
      <label className="sr-only" htmlFor={`export-format-${filename}`}>
        Export file format
      </label>
      <select
        id={`export-format-${filename}`}
        value={format}
        onChange={(event) => setFormat(event.target.value as ExportFormat)}
        disabled={exporting}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
      >
        {formats.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={exporting || rows.length === 0}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      >
        {exporting ? "Preparing..." : buttonLabel}
      </button>
    </div>
  );
}
