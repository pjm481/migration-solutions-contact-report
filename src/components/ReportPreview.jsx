import { useEffect, useState } from "react";
import {
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";
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

const ReportPreview = ({ report, onClose }) => {
  const [downloadState, setDownloadState] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const download = async (type) => {
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
    <div className="report-modal" role="dialog" aria-modal="true" aria-label="Time spent report preview">
      <header className="report-toolbar">
        <div className="report-toolbar__title">
          <span className="report-toolbar__icon" aria-hidden="true">
            <FileText size={19} />
          </span>
          <span>
            <strong>Report preview</strong>
            <small>
              {formatRecordCount(report.matters.length, "matter")} ·{" "}
              {formatRecordCount(report.entryCount, "time entry", "time entries")}
            </small>
          </span>
        </div>
        <div className="report-toolbar__actions">
          <div className="report-toolbar__total">
            <Clock3 size={16} /> {formatDuration(report.totalMinutes)}
          </div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => download("docx")}
            disabled={Boolean(downloadState)}
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
            disabled={Boolean(downloadState)}
          >
            {downloadState === "pdf" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            PDF
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close report preview"
          >
            <X size={20} />
          </button>
        </div>
      </header>
      {downloadError && <div className="download-error">{downloadError}</div>}
      <main className="report-canvas">
        {report.matters.map((matter) => (
          <MatterPage report={report} matter={matter} key={matter.id} />
        ))}
      </main>
    </div>
  );
};

export default ReportPreview;
