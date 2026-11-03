import { describe, expect, test } from "vitest";
import { formatDuration, reportFileName } from "./format";

describe("report formatting", () => {
  test.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 hr"],
    [195, "3 hr 15 min"],
  ])("formats %i minutes", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  test("creates a safe, descriptive download name", () => {
    expect(
      reportFileName(
        {
          contact: { name: "Fred Nerk" },
          range: { startDate: "2026-10-01", endDate: "2026-10-31" },
        },
        "docx"
      )
    ).toBe("time-spent-fred-nerk-2026-10-01-to-2026-10-31.docx");
  });
});
