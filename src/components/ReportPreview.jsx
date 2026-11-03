import { useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Download,
  FileText,
  ListFilter,
  LoaderCircle,
  Users,
} from "lucide-react";
import MultiSelectPicker from "./MultiSelectPicker";
import {
  formatDisplayDate,
  formatDuration,
  formatRecordCount,
} from "../utils/format";

const SummaryColumn = ({ title, items, totalMinutes }) => (
  <div className="report-column">
    <div className="report-column__head">
      <span>{title}</span>
      <span>Time</span>
    </div>
    <div className="report-column__body">
      {items.map((item) => (
        <div className="report-column__row" key={item.label}>
          <span>{item.label}</span>
          <span>{item.minutes}</span>
        </div>
      ))}
    </div>
    <div className="report-column__total">
      <span>{title} Total</span>
      <span>{formatDuration(totalMinutes)}</span>
    </div>
  </div>
);

const MatterPage = ({ report, matter }) => (
  <article className="report-page">
    <h2>Time Spent Matter Report</h2>
    <div className="report-metadata">
      <div>
        <span>Contact Name:</span> {report.contact.name}
      </div>
      <div>
        <span>MS File No:</span> {report.contact.msFileNumber}
      </div>
      <div>
        <span>Date Range:</span> {formatDisplayDate(report.range.startDate)} -{" "}
        {formatDisplayDate(report.range.endDate)}
      </div>
      <div>
        <span>Matter No:</span> {matter.matterNumber}
      </div>
    </div>

    {matter.staff.map((staff) => (
      <section className="staff-summary" key={staff.ownerId}>
        <div className="staff-summary__identity">
          <div>
            <span>Matter No</span>
            <strong>{matter.matterNumber}</strong>
          </div>
          <div>
            <span>Staff Member</span>
            <strong>{staff.ownerName}</strong>
          </div>
        </div>
        <div className="staff-summary__grid">
          <SummaryColumn
            title="Stage"
            items={staff.stages}
            totalMinutes={staff.totalMinutes}
          />
          <SummaryColumn
            title="Category"
            items={staff.categories}
            totalMinutes={staff.totalMinutes}
          />
          <SummaryColumn
            title="Activity Type"
            items={staff.activityTypes}
            totalMinutes={staff.totalMinutes}
          />
        </div>
      </section>
    ))}
  </article>
);

const ReportPreview = ({
  report,
  filterMessage,
  owners,
  matters,
  matterContext,
  startDate,
  endDate,
  selectedOwnerIds,
  selectedMatterIds,
  onStartDateChange,
  onEndDateChange,
  onSelectedOwnerIdsChange,
  onSelectedMatterIdsChange,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [downloadState, setDownloadState] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const hasEntries = Boolean(report?.entryCount);
  const emptyMessage = filterMessage || "No time entries match these filters.";

  const download = async (type) => {
    if (!hasEntries) return;
    setDownloadState(type);
    setDownloadError("");
    try {
      if (type === "docx") {
        const { downloadDocx } = await import("../report/docx");
        await downloadDocx(report);
      } else {
        const { downloadPdf } = await import("../report/pdf");
        downloadPdf(report);
      }
    } catch (error) {
      setDownloadError(error?.message || `Could not create the ${type.toUpperCase()} file.`);
    } finally {
      setDownloadState(null);
    }
  };

  return (
    <div className="report-view" aria-label="Time spent report preview">
      <header className="report-toolbar">
        <div className="report-toolbar__title">
          <span className="report-toolbar__icon" aria-hidden="true">
            <FileText size={19} />
          </span>
          <span>
            <strong>Report preview</strong>
            <small>
              {formatRecordCount(report?.matters.length || 0, "matter")} ·{" "}
              {formatRecordCount(report?.entryCount || 0, "time entry", "time entries")}
            </small>
          </span>
        </div>
        <div className="report-toolbar__actions">
          <div className="report-toolbar__total">
            <Clock3 size={16} /> {formatDuration(report?.totalMinutes || 0)}
          </div>
          <button
            type="button"
            className={`button button--toolbar ${filtersOpen ? "is-active" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="report-filters"
          >
            <ListFilter size={17} /> Filters
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => download("docx")}
            disabled={Boolean(downloadState) || !hasEntries}
          >
            {downloadState === "docx" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            DOCX
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => download("pdf")}
            disabled={Boolean(downloadState) || !hasEntries}
          >
            {downloadState === "pdf" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            PDF
          </button>
        </div>
      </header>

      {filtersOpen && (
        <section className="report-filters" id="report-filters" aria-label="Report filters">
          <label className="date-field">
            <span className="field-label">Start date</span>
            <span className="date-field__control">
              <CalendarDays size={17} />
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
              />
            </span>
          </label>
          <label className="date-field">
            <span className="field-label">End date</span>
            <span className="date-field__control">
              <CalendarDays size={17} />
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
              />
            </span>
          </label>
          <MultiSelectPicker
            label="History owner"
            pluralLabel="owners"
            icon={Users}
            options={owners}
            selectedIds={selectedOwnerIds}
            onChange={onSelectedOwnerIdsChange}
            disabled={!owners.length}
          />
          <MultiSelectPicker
            label="Matter No"
            pluralLabel="matters"
            icon={BriefcaseBusiness}
            options={matters}
            selectedIds={selectedMatterIds}
            onChange={onSelectedMatterIdsChange}
            disabled={matterContext || !matters.length}
          />
          <div className="report-filters__actions">
            <div className="report-filters__summary" aria-live="polite">
              Showing {formatRecordCount(report?.matters.length || 0, "matter")},{" "}
              {formatRecordCount(report?.ownerCount || 0, "owner")}, and{" "}
              {formatRecordCount(report?.entryCount || 0, "time entry", "time entries")}.
            </div>
            <button
              type="button"
              className="button button--filter-done"
              onClick={() => setFiltersOpen(false)}
            >
              <Check size={17} /> Done
            </button>
          </div>
        </section>
      )}

      {downloadError && <div className="download-error">{downloadError}</div>}
      <main className="report-canvas">
        {hasEntries ? (
          report.matters.map((matter) => (
            <MatterPage report={report} matter={matter} key={matter.id} />
          ))
        ) : (
          <section className="report-page report-page--empty">
            <AlertCircle size={28} />
            <h2>Nothing to show yet</h2>
            <p>{emptyMessage}</p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setFiltersOpen(true)}
            >
              <ListFilter size={17} /> Adjust filters
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReportPreview;
