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

function getFiscalRange(years) {
  if (!years.length) return "Loading";

  const fiscalYears = years.map((year) => year.fiscalYear);
  return `FY ${Math.min(...fiscalYears)} to FY ${Math.max(...fiscalYears)}`;
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
            <strong>{formatMoney(row.dollarAmount)}</strong>
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
              <span>{formatPercent(row.percentage)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [budgetYears, setBudgetYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [budgetDetail, setBudgetDetail] = useState(null);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [fundFilter, setFundFilter] = useState("all");
  const [sortMode, setSortMode] = useState("amount");
  const [rowLimit, setRowLimit] = useState("100");

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!selectedYear) return undefined;

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
  }, [selectedYear]);

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
  const selectedYearSummary = budgetYears.find(
    (year) => String(year.fiscalYear) === selectedYear
  );

  return (
    <main className="page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Maryland open budget</p>
          <h1>Maryland Operating Budget</h1>
          <p>
            Agency, program, and fund allocations from Maryland's current
            operating budget open-data release.
          </p>
        </div>

        <aside className="source-panel" aria-label="Official data source">
          <span>Official source</span>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer">
            {SOURCE_LABEL}
          </a>
          <small>Data last modified {SOURCE_LAST_MODIFIED}</small>
          <small>Metadata updated {SOURCE_METADATA_UPDATED}</small>
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
                <span>{getFiscalRange(budgetYears)}</span>
              </div>

              <BudgetBars rows={chartRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown title="Top Agencies" rows={budgetDetail.topAgencies} />
              <MiniBreakdown title="Fund Types" rows={budgetDetail.fundTypes} />
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
                <span>{formatMoney(selectedYearSummary.totalAmount)}</span>
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
