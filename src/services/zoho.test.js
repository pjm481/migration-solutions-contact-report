import { afterEach, describe, expect, test, vi } from "vitest";
import { initializeWidget } from "./zoho";

const installWindow = (zoho) => {
  globalThis.window = {
    ZOHO: zoho,
    self: globalThis,
    top: globalThis,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
};

afterEach(() => {
  delete globalThis.window;
  vi.restoreAllMocks();
});

describe("Zoho widget initialization", () => {
  test("loads the active Contact, Matters, and Matter History from Zoho", async () => {
    let pageLoad;
    const getRecord = vi.fn(async ({ Entity, RecordID }) => ({
      data: [
        {
          id: RecordID,
          Full_Name: Entity === "Contacts" ? "Live CRM Contact" : undefined,
          ID_Number: Entity === "Contacts" ? "LIVE-42" : undefined,
        },
      ],
    }));
    const getRelatedRecords = vi.fn(async ({ Entity, RelatedList }) => {
      if (Entity === "Contacts" && RelatedList === "Applications") {
        return {
          data: [{ id: "matter-live", Name: "MAT-LIVE" }],
          info: { more_records: false },
        };
      }
      if (Entity === "Applications" && RelatedList === "Application_History") {
        return {
          data: [
            {
              id: "history-live",
              Date: "2026-11-02",
              Owner: { id: "owner-live", name: "Live Staff Member" },
              Duration_Min: 35,
            },
          ],
          info: { more_records: false },
        };
      }
      throw new Error(`Unexpected related-list request: ${Entity}.${RelatedList}`);
    });
    const zoho = {
      embeddedApp: {
        on: vi.fn((event, callback) => {
          expect(event).toBe("PageLoad");
          pageLoad = callback;
        }),
        init: vi.fn(async () => {
          pageLoad({ Entity: "Contacts", EntityId: ["contact-live"] });
        }),
      },
      CRM: {
        API: { getRecord, getRelatedRecords },
        UI: { Resize: vi.fn(async () => {}) },
      },
    };
    installWindow(zoho);

    const source = await initializeWidget();

    expect(source).toMatchObject({
      mode: "zoho",
      entity: "Contacts",
      recordId: "contact-live",
      contact: {
        id: "contact-live",
        Full_Name: "Live CRM Contact",
        ID_Number: "LIVE-42",
      },
      matters: [
        {
          id: "matter-live",
          Name: "MAT-LIVE",
          histories: [
            {
              id: "history-live",
              Owner: { id: "owner-live", name: "Live Staff Member" },
              Duration_Min: 35,
            },
          ],
        },
      ],
    });
    expect(getRecord).toHaveBeenCalledWith({
      Entity: "Contacts",
      RecordID: "contact-live",
      approved: "both",
    });
  });

  test("never substitutes demo records when Zoho is unavailable", async () => {
    installWindow(undefined);

    await expect(initializeWidget()).rejects.toThrow(
      "Live Zoho CRM context is unavailable"
    );
  });
});
