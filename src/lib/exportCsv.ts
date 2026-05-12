import { asText } from "./formatting";

export function rowsToCsv<T extends Record<string, unknown>>(rows: T[], columns?: string[]): string {
  const headers = columns ?? Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const escape = (value: unknown) => {
    const text = asText(value).replace(/"/g, '""');
    return /[",\n]/.test(text) ? `"${text}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export function downloadCsv<T extends Record<string, unknown>>(filename: string, rows: T[], columns?: string[]): void {
  const csv = rowsToCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
