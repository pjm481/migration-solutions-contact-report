export const toDateInputValue = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const currentMonthRange = (now = new Date()) => ({
  startDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
  endDate: toDateInputValue(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  ),
});

export const formatDisplayDate = (value) => {
  if (!value) return "—";
  const raw = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(raw.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  }).format(raw);
};

export const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
};

export const formatRecordCount = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const safeFilePart = (value) =>
  String(value || "report")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "report";

export const reportFileName = (report, extension) => {
  const contact = safeFilePart(report?.contact?.name || "contact");
  const start = report?.range?.startDate || "start";
  const end = report?.range?.endDate || "end";
  return `time-spent-${contact}-${start}-to-${end}.${extension}`;
};
