import { describe, expect, test } from "vitest";
import { createMockSource } from "../data/mockData";
import {
  buildReport,
  normalizeSource,
  ownerOptionsFromSource,
} from "./reportData";

describe("time spent report data", () => {
  const source = normalizeSource(createMockSource());

  test("discovers unique owners from history records", () => {
    expect(ownerOptionsFromSource(source)).toEqual([
      { id: "admin", name: "Admin" },
      { id: "nam", name: "Nam Hoang" },
    ]);
  });

  test("filters inclusively and aggregates every report dimension", () => {
    const report = buildReport(source, {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      selectedOwnerIds: ["nam"],
    });

    expect(report.matters).toHaveLength(2);
    expect(report.entryCount).toBe(5);
    expect(report.totalMinutes).toBe(135);
    expect(report.matters[0].staff[0]).toMatchObject({
      ownerName: "Nam Hoang",
      totalMinutes: 75,
      categories: [
        { label: "Other", minutes: 45 },
        { label: "Administration", minutes: 20 },
        { label: "Technical casework", minutes: 10 },
      ],
    });
  });

  test("excludes zero-duration and out-of-range entries", () => {
    const modified = {
      ...source,
      histories: [
        ...source.histories,
        {
          ...source.histories[0],
          id: "zero",
          durationMinutes: 0,
        },
      ],
    };
    const report = buildReport(modified, {
      startDate: "2026-10-01",
      endDate: "2026-10-10",
      selectedOwnerIds: ["nam", "admin"],
    });
    expect(report.entryCount).toBe(3);
    expect(report.totalMinutes).toBe(65);
  });
});
