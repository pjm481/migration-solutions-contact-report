import { describe, expect, test } from "vitest";
import { createMockSource } from "../data/mockData";
import { buildReport, normalizeSource, ownerOptionsFromSource } from "../services/reportData";
import { createDocxBlob } from "./docx";
import { createPdfBlob } from "./pdf";

const source = normalizeSource(createMockSource());
const report = buildReport(source, {
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  selectedOwnerIds: ownerOptionsFromSource(source).map((owner) => owner.id),
});

describe("report exports", () => {
  test("creates a non-empty DOCX blob", async () => {
    const blob = await createDocxBlob(report);
    expect(blob.type).toContain("wordprocessingml");
    expect(blob.size).toBeGreaterThan(5000);
  });

  test("creates a non-empty PDF blob", () => {
    const blob = createPdfBlob(report);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(5000);
  });
});
