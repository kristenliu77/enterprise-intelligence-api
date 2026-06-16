export function downloadCsv<T extends object>(filename: string, rows: T[]): void {
  if (!rows.length) {
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const raw = row[header as keyof T];
          const value = raw == null ? "" : String(raw);
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printCurrentPage(): void {
  window.print();
}
