import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import ReportPreview from "./components/ReportPreview";
import { buildReport, normalizeSource, ownerOptionsFromSource } from "./services/reportData";
import { initializeWidget } from "./services/zoho";
import { currentMonthRange, toDateInputValue } from "./utils/format";

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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const normalized = normalizeSource(await initializeWidget());
      const owners = ownerOptionsFromSource(normalized);
      const initialRange = sourceRange(normalized);
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

  const filterMessage = useMemo(() => {
    if (!startDate || !endDate) return "Choose both a start date and an end date.";
    if (new Date(`${startDate}T00:00:00`) > new Date(`${endDate}T23:59:59`)) {
      return "The end date must be on or after the start date.";
    }
    if (!selectedOwnerIds.length) return "Select at least one history owner.";
    return "";
  }, [endDate, selectedOwnerIds, startDate]);

  const report = useMemo(() => {
    if (!source || filterMessage) return null;
    return buildReport(source, { startDate, endDate, selectedOwnerIds });
  }, [source, startDate, endDate, selectedOwnerIds, filterMessage]);

  if (loading) {
    return (
      <main className="app-state" aria-live="polite">
        <LoaderCircle className="spin" size={28} />
        <div>
          <h1>Preparing report</h1>
          <p>Loading contact, matter, owner, and time-entry data from Zoho CRM.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-state app-state--error" role="alert">
        <AlertCircle size={28} />
        <div>
          <h1>Report data is unavailable</h1>
          <p>{error}</p>
          <button type="button" className="text-button" onClick={load}>
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <ReportPreview
      report={report}
      filterMessage={filterMessage}
      owners={owners}
      startDate={startDate}
      endDate={endDate}
      selectedOwnerIds={selectedOwnerIds}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onSelectedOwnerIdsChange={setSelectedOwnerIds}
    />
  );
};

export default App;
