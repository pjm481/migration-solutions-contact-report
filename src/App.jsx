import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBarChart,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import OwnerPicker from "./components/OwnerPicker";
import ReportPreview from "./components/ReportPreview";
import { buildReport, normalizeSource, ownerOptionsFromSource } from "./services/reportData";
import { initializeWidget } from "./services/zoho";
import { currentMonthRange, formatDuration, formatRecordCount, toDateInputValue } from "./utils/format";

const defaultRange = currentMonthRange();

const sourceRange = (source) => {
  const dates = source.histories
    .map((history) => history.date)
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!dates.length) return defaultRange;
  return {
    startDate: toDateInputValue(dates[0]),
    endDate: toDateInputValue(dates[dates.length - 1]),
  };
};

const App = () => {
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState(null);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState([]);
  const [previewReport, setPreviewReport] = useState(null);
  const [formMessage, setFormMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setFormMessage("");
    try {
      const normalized = normalizeSource(await initializeWidget());
      const owners = ownerOptionsFromSource(normalized);
      const initialRange = normalized.mode === "demo" ? sourceRange(normalized) : defaultRange;
      setSource(normalized);
      setStartDate(initialRange.startDate);
      setEndDate(initialRange.endDate);
      setSelectedOwnerIds(owners.map((owner) => owner.id));
    } catch (loadError) {
      setError(loadError?.message || "The CRM report data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    load();
  }, []);

  const owners = useMemo(
    () => (source ? ownerOptionsFromSource(source) : []),
    [source]
  );

  const visibleReport = useMemo(() => {
    if (!source || !startDate || !endDate || !selectedOwnerIds.length) return null;
    return buildReport(source, { startDate, endDate, selectedOwnerIds });
  }, [source, startDate, endDate, selectedOwnerIds]);

  const openReport = () => {
    setFormMessage("");
    if (!startDate || !endDate) {
      setFormMessage("Choose both a start date and an end date.");
      return;
    }
    if (new Date(`${startDate}T00:00:00`) > new Date(`${endDate}T23:59:59`)) {
      setFormMessage("The end date must be on or after the start date.");
      return;
    }
    if (!selectedOwnerIds.length) {
      setFormMessage("Select at least one history owner.");
      return;
    }
    if (!visibleReport?.entryCount) {
      setFormMessage("No time entries match this date range and owner selection.");
      return;
    }
    setPreviewReport(visibleReport);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <FileBarChart size={23} />
        </div>
        <div className="app-header__copy">
          <p>Migration Solutions</p>
          <h1>Time spent report</h1>
        </div>
        <div className="app-header__status">
          <ShieldCheck size={16} />
          {!source
            ? "Preparing data"
            : source.mode === "demo"
              ? "Demo data"
              : "Connected to Zoho CRM"}
        </div>
      </header>

      <main className="workspace">
        <section className="intro">
          <div>
            <span className="eyebrow">Matter reporting</span>
            <h2>Turn CRM history into a ready-to-share report.</h2>
            <p>
              Choose a date range and the staff members to include. The report opens
              in a preview first, then downloads as DOCX or PDF.
            </p>
          </div>
          <div className="intro__proof">
            <CheckCircle2 size={19} />
            <span>One page per matter</span>
            <CheckCircle2 size={19} />
            <span>Totals in hours and minutes</span>
          </div>
        </section>

        {loading ? (
          <section className="state-panel" aria-live="polite">
            <LoaderCircle className="spin" size={28} />
            <div>
              <h3>Loading CRM history</h3>
              <p>Collecting the contact, matters, owners, and time entries.</p>
            </div>
          </section>
        ) : error ? (
          <section className="state-panel state-panel--error" role="alert">
            <AlertCircle size={28} />
            <div>
              <h3>Report data is unavailable</h3>
              <p>{error}</p>
              <button type="button" className="text-button" onClick={load}>
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="report-builder" aria-labelledby="builder-title">
              <div className="report-builder__heading">
                <div>
                  <span className="step-number">01</span>
                  <div>
                    <h3 id="builder-title">Report scope</h3>
                    <p>
                      {source.contact.name} · MS file {source.contact.msFileNumber}
                    </p>
                  </div>
                </div>
                <span className="data-badge">
                  {formatRecordCount(source.matters.length, "matter")}
                </span>
              </div>

              <div className="filter-grid">
                <label className="date-field">
                  <span className="field-label">Start date</span>
                  <span className="date-field__control">
                    <CalendarDays size={17} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
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
                      onChange={(event) => setEndDate(event.target.value)}
                    />
                  </span>
                </label>
                <OwnerPicker
                  owners={owners}
                  selectedIds={selectedOwnerIds}
                  onChange={setSelectedOwnerIds}
                  disabled={!owners.length}
                />
              </div>

              <div className="builder-footer">
                <div className="selection-summary" aria-live="polite">
                  <span>
                    <Clock3 size={16} />
                    {visibleReport ? formatDuration(visibleReport.totalMinutes) : "0 min"}
                  </span>
                  <span>
                    <Users size={16} />
                    {visibleReport ? formatRecordCount(visibleReport.ownerCount, "owner") : "0 owners"}
                  </span>
                  <span>
                    <FileBarChart size={16} />
                    {visibleReport ? formatRecordCount(visibleReport.entryCount, "entry", "entries") : "0 entries"}
                  </span>
                </div>
                <button type="button" className="button button--open" onClick={openReport}>
                  Open report <ArrowRight size={18} />
                </button>
              </div>
              {formMessage && (
                <div className="form-message" role="alert">
                  <AlertCircle size={16} /> {formMessage}
                </div>
              )}
            </section>

            <section className="report-anatomy" aria-label="Report contents">
              <span className="step-number">02</span>
              <div>
                <h3>What the report includes</h3>
                <p>
                  Matter pages are split by staff member and summarised across Stage,
                  Category, and Activity Type. Empty and zero-minute records are omitted.
                </p>
              </div>
              <div className="anatomy-track" aria-hidden="true">
                <span>Contact</span>
                <i />
                <span>Matter</span>
                <i />
                <span>Staff</span>
                <i />
                <span>Time summary</span>
              </div>
            </section>
          </>
        )}
      </main>

      {previewReport && (
        <ReportPreview report={previewReport} onClose={() => setPreviewReport(null)} />
      )}
    </div>
  );
};

export default App;
