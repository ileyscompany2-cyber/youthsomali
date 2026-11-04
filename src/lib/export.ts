export function writeCsv(records: readonly unknown[]): string {
  if (records.length === 0) return "";
  const rows = records.map(record => {
    if (typeof record !== "object" || record === null || Array.isArray(record)) {
      throw new TypeError("CSV records must be objects.");
    }
    return record as Record<string, unknown>;
  });
  const keys = [...new Set(rows.flatMap(record => Object.keys(record)))].sort();
  const cell = (value: unknown) => {
    let text = typeof value === "string" ? value : value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : JSON.stringify(value) ?? String(value);
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return `\uFEFF${keys.map(cell).join(",")}\r\n${rows.map(record => keys.map(key => cell(record[key])).join(",")).join("\r\n")}`;
}
