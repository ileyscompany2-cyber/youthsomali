import { describe, expect, it } from "vitest";
import { writeCsv } from "./export";

describe("CSV export", () => {
  it("quotes special characters and neutralizes spreadsheet formulas", () => {
    const csv = writeCsv([
      { name: 'YPP, "Community"', note: "=HYPERLINK(\"https://example.org\")" },
    ]);

    expect(csv).toContain('"name","note"');
    expect(csv).toContain('"YPP, ""Community"""');
    expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.org\"\")\"");
  });

  it("returns an empty file body for an empty page", () => {
    expect(writeCsv([])).toBe("");
  });
});
