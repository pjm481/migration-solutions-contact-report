import { CRM_CONFIG } from "../config";

const firstValue = (record, fieldNames, fallback = "") => {
  for (const field of fieldNames) {
    const value = record?.[field];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return fallback;
};

const normalizeLookup = (value, fallbackName = "Unknown owner") => {
  if (!value) return { id: `name:${fallbackName}`, name: fallbackName };
  if (typeof value === "string" || typeof value === "number") {
    const name = String(value);
    return { id: `name:${name}`, name };
  }
  const name =
    value.full_name ||
    value.name ||
    value.Full_Name ||
    [value.first_name, value.last_name].filter(Boolean).join(" ").trim() ||
    fallbackName;
  return {
    id: String(value.id || value.ID || `name:${name}`),
    name,
  };
};

const normalizeDuration = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeSource = (source, config = CRM_CONFIG) => {
  const contact = {
    id: source.contact?.id || source.recordId || "",
    name: String(
      firstValue(source.contact, config.fields.contactName, "Unknown contact")
    ),
    msFileNumber: String(
      firstValue(source.contact, config.fields.msFileNumber, "Not recorded")
    ),
  };

  const matters = (source.matters || []).map((matter) => {
    const matterNumber = String(
      firstValue(matter, config.fields.matterNumber, "Unnumbered matter")
    );
    const matterStage = String(
      firstValue(matter, config.fields.matterStage, "Not specified")
    );
    const histories = (matter.histories || [])
      .map((history, index) => {
        const owner = normalizeLookup(
          firstValue(history, config.fields.historyOwner, null)
        );
        const rawDate = firstValue(history, config.fields.historyDate, null);
        return {
          id: String(history.id || `${matter.id || matterNumber}-${index}`),
          matterId: String(matter.id || matterNumber),
          matterNumber,
          ownerId: owner.id,
          ownerName: owner.name,
          date: normalizeDate(rawDate),
          rawDate,
          stage: String(
            firstValue(history, config.fields.historyStage, matterStage) ||
              "Not specified"
          ),
          category: String(
            firstValue(history, config.fields.historyCategory, "Uncategorised")
          ),
          activityType: String(
            firstValue(
              history,
              config.fields.historyActivityType,
              "Not specified"
            )
          ),
          durationMinutes: normalizeDuration(
            firstValue(history, config.fields.historyDuration, 0)
          ),
        };
      })
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date - b.date;
      });
    return {
      id: String(matter.id || matterNumber),
      matterNumber,
      histories,
    };
  });

  return {
    mode: source.mode || "zoho",
    entity: source.entity,
    recordId: source.recordId,
    contact,
    matters,
    histories: matters.flatMap((matter) => matter.histories),
  };
};

export const ownerOptionsFromSource = (source) => {
  const owners = new Map();
  source.histories.forEach((history) => {
    if (!owners.has(history.ownerId)) {
      owners.set(history.ownerId, {
        id: history.ownerId,
        name: history.ownerName,
      });
    }
  });
  return [...owners.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const withinRange = (date, startDate, endDate) => {
  if (!date) return false;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);
  return date >= start && date <= end;
};

const aggregateBy = (records, field) => {
  const groups = new Map();
  records.forEach((record) => {
    const label = record[field] || "Not specified";
    groups.set(label, (groups.get(label) || 0) + record.durationMinutes);
  });
  return [...groups.entries()].map(([label, minutes]) => ({ label, minutes }));
};

export const buildReport = (
  source,
  { startDate, endDate, selectedOwnerIds }
) => {
  const selected = new Set(selectedOwnerIds || []);
  const filteredRecords = source.histories.filter(
    (history) =>
      selected.has(history.ownerId) &&
      withinRange(history.date, startDate, endDate) &&
      history.durationMinutes > 0
  );

  const matterGroups = source.matters
    .map((matter) => {
      const matterRecords = filteredRecords.filter(
        (record) => record.matterId === matter.id
      );
      const staff = [...new Set(matterRecords.map((record) => record.ownerId))]
        .map((ownerId) => {
          const records = matterRecords.filter(
            (record) => record.ownerId === ownerId
          );
          return {
            ownerId,
            ownerName: records[0]?.ownerName || "Unknown owner",
            totalMinutes: records.reduce(
              (total, record) => total + record.durationMinutes,
              0
            ),
            stages: aggregateBy(records, "stage"),
            categories: aggregateBy(records, "category"),
            activityTypes: aggregateBy(records, "activityType"),
          };
        });

      return {
        id: matter.id,
        matterNumber: matter.matterNumber,
        staff,
        totalMinutes: matterRecords.reduce(
          (total, record) => total + record.durationMinutes,
          0
        ),
        entryCount: matterRecords.length,
      };
    })
    .filter((matter) => matter.entryCount > 0)
    .sort((a, b) =>
      a.matterNumber.localeCompare(b.matterNumber, undefined, { numeric: true })
    );

  return {
    generatedAt: new Date(),
    contact: source.contact,
    range: { startDate, endDate },
    matters: matterGroups,
    entryCount: filteredRecords.length,
    totalMinutes: filteredRecords.reduce(
      (total, record) => total + record.durationMinutes,
      0
    ),
    ownerCount: new Set(filteredRecords.map((record) => record.ownerId)).size,
  };
};
