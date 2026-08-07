/** Exports rows of plain values as a downloaded CSV file (Web Phase W1, Part 7: "Export CSV"). Browser-only — triggers a real file download via an object URL. */
export function exportToCsv(
  filename: string,
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]!);
  const escapeCell = (value: unknown): string => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
