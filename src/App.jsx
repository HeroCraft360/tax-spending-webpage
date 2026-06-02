import { useEffect, useMemo, useState } from "react";
import {
  fetchBudgetDetail,
  fetchBudgetYears,
  SOURCE_LABEL,
  SOURCE_LAST_MODIFIED,
  SOURCE_METADATA_UPDATED,
  SOURCE_URL,
} from "./data/marylandBudget";
import "./App.css";

const ROW_LIMITS = ["50", "100", "250", "all"];
const BAR_COLORS = [
  "#0f766e",
  "#2563eb",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#047857",
  "#334155",
  "#0891b2",
  "#a16207",
  "#4f46e5",
];

const STATE_OPTIONS = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland", isConnected: true },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const STATE_BY_CODE = Object.fromEntries(
  STATE_OPTIONS.map((state) => [state.code, state])
);

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value || 0) >= 1_000_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value || 0) >= 1_000_000_000 ? 1 : 0,
  }).format(value || 0);
}

function formatFullMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

function sortRows(rows, sortMode) {
  const sorted = [...rows];

  if (sortMode === "agency") {
    return sorted.sort((a, b) => a.agencyName.localeCompare(b.agencyName));
  }

  if (sortMode === "program") {
    return sorted.sort((a, b) => a.programName.localeCompare(b.programName));
  }

  return sorted.sort((a, b) => b.dollarAmount - a.dollarAmount);
}

function getGroupedTotals(rows, fieldName, totalAmount, limit = 12) {
  const grouped = new Map();

  for (const row of rows) {
    const name = row[fieldName] || "Unknown";
    grouped.set(name, (grouped.get(name) || 0) + row.dollarAmount);
  }

  return [...grouped.entries()]
    .map(([name, dollarAmount]) => ({
      name,
      dollarAmount,
      percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.dollarAmount - a.dollarAmount)
    .slice(0, limit);
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function MiniBreakdown({ title, rows }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>

      <div className="mini-list">
        {rows.map((row) => (
          <div className="mini-row" key={row.name}>
            <span>{row.name}</span>
            <strong>
              {formatMoney(row.dollarAmount)}
              <small>{formatPercent(row.percentage)}</small>
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function BudgetBars({ rows }) {
  const maxAmount = rows[0]?.dollarAmount || 0;

  if (!rows.length) {
    return <p className="empty-state">No allocations match the current filters.</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row, index) => {
        const width = maxAmount > 0 ? (row.dollarAmount / maxAmount) * 100 : 0;

        return (
          <div
            className="bar-row"
            key={`${row.agencyName}-${row.unitName}-${row.programName}-${row.fundType}`}
          >
            <div className="bar-row-top">
              <span>{row.programName}</span>
              <strong>{formatMoney(row.dollarAmount)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div
                className="bar-fill"
                style={{
                  "--bar-width": `${width}%`,
                  "--bar-color": BAR_COLORS[index % BAR_COLORS.length],
                }}
              />
            </div>
            <div className="bar-row-meta">
              <span>{row.agencyName}</span>
              <span>
                {row.unitName} / {row.fundType} / {formatPercent(row.percentage)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [activeStateCode, setActiveStateCode] = useState("");
  const [budgetYears, setBudgetYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [budgetDetail, setBudgetDetail] = useState(null);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [fundFilter, setFundFilter] = useState("all");
  const [sortMode, setSortMode] = useState("amount");
  const [rowLimit, setRowLimit] = useState("100");
  const selectedState = STATE_BY_CODE[selectedStateCode];
  const activeState = STATE_BY_CODE[activeStateCode];
  const canOpenSelectedState = Boolean(selectedState?.isConnected);

  function resetFilters() {
    setSearchQuery("");
    setAgencyFilter("all");
    setFundFilter("all");
    setSortMode("amount");
    setRowLimit("100");
  }

  function clearBudgetData() {
    setBudgetYears([]);
    setSelectedYear("");
    setBudgetDetail(null);
    setErrorMessage("");
    setLoadingYears(false);
    setLoadingDetail(false);
    resetFilters();
  }

  function openSelectedState() {
    if (!canOpenSelectedState) return;
    clearBudgetData();
    setActiveStateCode(selectedStateCode);
  }

  function changeState() {
    setActiveStateCode("");
    clearBudgetData();
  }

  useEffect(() => {
    if (!activeStateCode) return undefined;

    const controller = new AbortController();

    async function loadYears() {
      setLoadingYears(true);
      setErrorMessage("");

      try {
        const years = await fetchBudgetYears(controller.signal);

        if (!years.length) {
          throw new Error("No Maryland budget years were returned.");
        }

        setBudgetYears(years);
        setSelectedYear(String(years[0].fiscalYear));
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMessage(error.message);
        }
      } finally {
        setLoadingYears(false);
      }
    }

    loadYears();

    return () => controller.abort();
  }, [activeStateCode]);

  useEffect(() => {
    if (!activeStateCode || !selectedYear) return undefined;

    const controller = new AbortController();

    async function loadBudgetDetail() {
      setBudgetDetail(null);
      setLoadingDetail(true);
      setErrorMessage("");
      setSearchQuery("");
      setAgencyFilter("all");
      setFundFilter("all");

      try {
        const detail = await fetchBudgetDetail(
          Number(selectedYear),
          controller.signal
        );

        if (!detail.allocations.length) {
          throw new Error(`No budget allocations were returned for FY ${selectedYear}.`);
        }

        setBudgetDetail(detail);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMessage(error.message);
        }
      } finally {
        setLoadingDetail(false);
      }
    }

    loadBudgetDetail();

    return () => controller.abort();
  }, [activeStateCode, selectedYear]);

  const agencyOptions = useMemo(() => {
    if (!budgetDetail) return [];

    return [...new Set(budgetDetail.allocations.map((row) => row.agencyName))]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 150);
  }, [budgetDetail]);

  const fundOptions = useMemo(() => {
    if (!budgetDetail) return [];

    return [...new Set(budgetDetail.allocations.map((row) => row.fundType))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [budgetDetail]);

  const filteredRows = useMemo(() => {
    if (!budgetDetail) return [];

    const query = searchQuery.trim().toLowerCase();
    const rows = budgetDetail.allocations.filter((row) => {
      const matchesAgency =
        agencyFilter === "all" || row.agencyName === agencyFilter;
      const matchesFund = fundFilter === "all" || row.fundType === fundFilter;
      const matchesSearch =
        !query ||
        row.agencyName.toLowerCase().includes(query) ||
        row.unitName.toLowerCase().includes(query) ||
        row.programName.toLowerCase().includes(query) ||
        row.fundType.toLowerCase().includes(query);

      return matchesAgency && matchesFund && matchesSearch;
    });

    return sortRows(rows, sortMode);
  }, [agencyFilter, budgetDetail, fundFilter, searchQuery, sortMode]);

  const displayedRows =
    rowLimit === "all"
      ? filteredRows
      : filteredRows.slice(0, Number(rowLimit));

  const chartRows = [...filteredRows]
    .sort((a, b) => b.dollarAmount - a.dollarAmount)
    .slice(0, 10);

  const filteredTotal = filteredRows.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );
  const filteredAgencyRows = getGroupedTotals(
    filteredRows,
    "agencyName",
    filteredTotal
  );
  const filteredFundRows = getGroupedTotals(filteredRows, "fundType", filteredTotal);
  const selectedYearSummary = budgetYears.find(
    (year) => String(year.fiscalYear) === selectedYear
  );
  const selectedYearLabel = selectedYear ? `FY ${selectedYear}` : "Loading";
  const hasActiveFilters =
    searchQuery.trim() ||
    agencyFilter !== "all" ||
    fundFilter !== "all" ||
    sortMode !== "amount" ||
    rowLimit !== "100";

  if (!activeState) {
    return (
      <main className="page page-centered">
        <section className="welcome-screen">
          <div className="welcome-copy">
            <p className="eyebrow">State operating budget</p>
            <h1>Choose a state budget to explore</h1>
            <p>
              Start with a state, then review operating-budget totals by fiscal
              year, agency, program, unit, and fund type.
            </p>
          </div>

          <div className="welcome-panel">
            <div className="control-field">
              <label htmlFor="state-select">State</label>
              <select
                id="state-select"
                value={selectedStateCode}
                onChange={(event) => setSelectedStateCode(event.target.value)}
              >
                <option value="">Choose a state</option>
                {STATE_OPTIONS.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                    {state.isConnected ? "" : " (coming soon)"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={openSelectedState}
              disabled={!canOpenSelectedState}
            >
              View operating budget
            </button>

            {selectedStateCode && !canOpenSelectedState && (
              <p className="state-message">
                {selectedState?.name} is not connected yet. Maryland operating
                budget data is available now.
              </p>
            )}

            <div className="connected-state">
              <span>Connected now</span>
              <strong>Maryland</strong>
              <small>{SOURCE_LABEL}</small>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{activeState.name} state operating budget</p>
          <h1>{activeState.name} Operating Budget</h1>
          <p>
            Agency, program, and fund allocations from {activeState.name}'s current
            operating budget open-data release.
          </p>
        </div>

        <aside className="source-panel" aria-label="Official data source">
          <span>Selected state</span>
          <strong>{activeState.name}</strong>
          <span>Official source</span>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer">
            {SOURCE_LABEL}
          </a>
          <small>Data last modified {SOURCE_LAST_MODIFIED}</small>
          <small>Metadata updated {SOURCE_METADATA_UPDATED}</small>
          <button type="button" className="secondary-button" onClick={changeState}>
            Change state
          </button>
        </aside>
      </header>

      <section className="toolbar" aria-label="Budget controls">
        <div className="control-field">
          <label htmlFor="year-select">Fiscal year</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            disabled={loadingYears || !budgetYears.length}
          >
            {budgetYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field control-field-wide">
          <label htmlFor="search-input">Search</label>
          <input
            id="search-input"
            type="search"
            placeholder="Agency, unit, program, or fund"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!budgetDetail}
          />
        </div>

        <div className="control-field">
          <label htmlFor="agency-filter">Agency</label>
          <select
            id="agency-filter"
            value={agencyFilter}
            onChange={(event) => setAgencyFilter(event.target.value)}
            disabled={!budgetDetail}
          >
            <option value="all">All agencies</option>
            {agencyOptions.map((agency) => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="fund-filter">Fund type</label>
          <select
            id="fund-filter"
            value={fundFilter}
            onChange={(event) => setFundFilter(event.target.value)}
            disabled={!budgetDetail}
          >
            <option value="all">All fund types</option>
            {fundOptions.map((fundType) => (
              <option key={fundType} value={fundType}>
                {fundType}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="sort-select">Sort</label>
          <select
            id="sort-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            disabled={!budgetDetail}
          >
            <option value="amount">Amount</option>
            <option value="agency">Agency</option>
            <option value="program">Program</option>
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="limit-select">Rows</label>
          <select
            id="limit-select"
            value={rowLimit}
            onChange={(event) => setRowLimit(event.target.value)}
            disabled={!budgetDetail}
          >
            {ROW_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                {limit === "all" ? "All" : limit}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <span className="control-label">Filters</span>
          <button
            id="reset-filters"
            type="button"
            aria-label="Reset filters"
            onClick={resetFilters}
            disabled={!budgetDetail || !hasActiveFilters}
          >
            Reset
          </button>
        </div>
      </section>

      {(loadingYears || loadingDetail) && (
        <section className="loading-panel" aria-live="polite">
          <div className="spinner" />
          <p>
            {loadingYears
              ? "Loading fiscal years..."
              : `Loading FY ${selectedYear} allocations...`}
          </p>
        </section>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {budgetDetail && !loadingDetail && (
        <>
          <section className="metrics-grid" aria-label="Budget summary">
            <MetricCard
              label={`FY ${budgetDetail.fiscalYear} positive budget total`}
              value={formatMoney(budgetDetail.totalAmount)}
              detail={formatFullMoney(budgetDetail.totalAmount)}
            />
            <MetricCard
              label="Source line items"
              value={formatNumber(budgetDetail.rowCount)}
              detail="Rows with budget values above zero"
            />
            <MetricCard
              label="Grouped allocations"
              value={formatNumber(budgetDetail.allocations.length)}
              detail="Agency, unit, program, and fund combinations"
            />
            <MetricCard
              label="Current filter total"
              value={formatMoney(filteredTotal)}
              detail={`${formatNumber(filteredRows.length)} matching allocations`}
            />
          </section>

          <section className="dashboard-grid">
            <section className="panel panel-large">
              <div className="panel-heading">
                <div>
                  <h2>Largest Program Allocations</h2>
                  <p>Top results after the active filters, sorted by amount.</p>
                </div>
                <span>
                  {selectedYearLabel} / {formatNumber(filteredRows.length)} rows
                </span>
              </div>

              <BudgetBars rows={chartRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown
                title="Top Agencies In View"
                rows={filteredAgencyRows}
              />
              <MiniBreakdown title="Fund Types In View" rows={filteredFundRows} />
            </div>
          </section>

          <section className="table-panel">
            <div className="panel-heading">
              <div>
                <h2>Allocation Detail</h2>
                <p>
                  Showing {formatNumber(displayedRows.length)} of{" "}
                  {formatNumber(filteredRows.length)} matching grouped rows.
                </p>
              </div>
              {selectedYearSummary && (
                <span>{formatMoney(filteredTotal)}</span>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Agency</th>
                    <th>Unit</th>
                    <th>Fund Type</th>
                    <th>Amount</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row) => (
                    <tr
                      key={`${row.agencyName}-${row.unitName}-${row.programName}-${row.fundType}`}
                    >
                      <td>{row.programName}</td>
                      <td>{row.agencyName}</td>
                      <td>{row.unitName}</td>
                      <td>{row.fundType}</td>
                      <td>{formatFullMoney(row.dollarAmount)}</td>
                      <td>{formatPercent(row.percentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="data-note">
            Maryland notes that this dataset can change as new data become
            available and does not guarantee completeness. Budget phase varies
            by fiscal year.
          </footer>
        </>
      )}
    </main>
  );
}
