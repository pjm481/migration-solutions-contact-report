import { CRM_CONFIG, REPORT_DEFAULTS } from "../config";
import { createMockSource } from "../data/mockData";

const getZoho = () => window.ZOHO;

const responseRecord = (response) => {
  const records = response?.data || response?.users || [];
  return Array.isArray(records) ? records[0] || null : null;
};

const lookupId = (value) => {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  const id = value.id || value.ID || value.Id;
  return id == null ? null : String(id);
};

const firstField = (record, fieldNames) => {
  for (const field of fieldNames) {
    if (record?.[field] != null && record[field] !== "") return record[field];
  }
  return null;
};

const getRecord = async (entity, recordId) => {
  const response = await getZoho().CRM.API.getRecord({
    Entity: entity,
    RecordID: recordId,
    approved: "both",
  });
  const record = responseRecord(response);
  if (!record?.id) {
    throw new Error(`Could not load ${entity} record ${recordId}.`);
  }
  return record;
};

const getRelatedRecords = async ({ entity, recordId, relatedList }) => {
  const records = [];
  for (
    let page = 1;
    page <= REPORT_DEFAULTS.maxPagesPerRelatedList;
    page += 1
  ) {
    const response = await getZoho().CRM.API.getRelatedRecords({
      Entity: entity,
      RecordID: recordId,
      RelatedList: relatedList,
      page,
      per_page: REPORT_DEFAULTS.pageSize,
    });
    if (response?.statusText === "nocontent") break;
    if (!Array.isArray(response?.data)) {
      throw new Error(
        response?.message || `Could not read the ${relatedList} related list.`
      );
    }
    records.push(...response.data);
    if (
      response?.info?.more_records === false ||
      (response?.info?.more_records !== true &&
        response.data.length < REPORT_DEFAULTS.pageSize)
    ) {
      break;
    }
    if (page === REPORT_DEFAULTS.maxPagesPerRelatedList) {
      throw new Error(
        `${relatedList} exceeds the supported ${
          REPORT_DEFAULTS.pageSize * REPORT_DEFAULTS.maxPagesPerRelatedList
        } records.`
      );
    }
  }
  return records;
};

const getRelatedRecordsWithFallback = async (args, relatedLists) => {
  let lastError = null;
  for (const relatedList of relatedLists) {
    try {
      return await getRelatedRecords({ ...args, relatedList });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Could not load the related records.");
};

const contactFromMatter = async (matter) => {
  const contactLookup = firstField(
    matter,
    CRM_CONFIG.fields.primaryContact
  );
  const contactId = lookupId(contactLookup);
  if (!contactId) {
    throw new Error(
      "This Matter does not have a primary Contact, so the report header cannot be completed."
    );
  }
  return getRecord(CRM_CONFIG.contactsModule, contactId);
};

const hydrateMatterHistory = async (matter) => ({
  ...matter,
  histories: await getRelatedRecordsWithFallback(
    {
      entity: CRM_CONFIG.mattersModule,
      recordId: matter.id,
    },
    CRM_CONFIG.matterHistoryRelatedLists
  ),
});

const loadFromZoho = async ({ entity, recordId }) => {
  const normalizedEntity = String(entity || "").toLowerCase();
  let contact;
  let matters;

  if (["contacts", "contact"].includes(normalizedEntity)) {
    contact = await getRecord(CRM_CONFIG.contactsModule, recordId);
    matters = await getRelatedRecords({
      entity: CRM_CONFIG.contactsModule,
      recordId,
      relatedList: CRM_CONFIG.contactMattersRelatedList,
    });
  } else if (["applications", "application"].includes(normalizedEntity)) {
    const matter = await getRecord(CRM_CONFIG.mattersModule, recordId);
    contact = await contactFromMatter(matter);
    matters = [matter];
  } else {
    throw new Error(
      `This widget supports Contact and Application records. It was opened from ${
        entity || "an unknown module"
      }.`
    );
  }

  const hydratedMatters = await Promise.all(matters.map(hydrateMatterHistory));
  return {
    mode: "zoho",
    entity,
    recordId,
    contact,
    matters: hydratedMatters,
  };
};

export const initializeWidget = async () => {
  const zoho = getZoho();
  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }
  if (!embedded || !zoho?.embeddedApp?.init || !zoho?.embeddedApp?.on) {
    return createMockSource();
  }

  const pageContext = await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Zoho did not provide the current record context.")),
      12000
    );
    zoho.embeddedApp.on("PageLoad", (data) => {
      window.clearTimeout(timeout);
      resolve(data || {});
    });
    zoho.embeddedApp.init().catch((error) => {
      window.clearTimeout(timeout);
      reject(error);
    });
  });

  try {
    await zoho.CRM.UI.Resize({ height: "800", width: "1200" });
  } catch {
    // The CRM host can reject resize dimensions without affecting reporting.
  }

  const recordId = Array.isArray(pageContext.EntityId)
    ? pageContext.EntityId[0]
    : pageContext.EntityId;
  if (!pageContext.Entity || !recordId) {
    throw new Error("Zoho did not identify the current Contact or Matter.");
  }
  return loadFromZoho({ entity: pageContext.Entity, recordId });
};
