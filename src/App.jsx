import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SOURCE_METADATA,
  fetchBudgetDetail,
  fetchBudgetYears,
  SOURCE_LABEL,
  SOURCE_LAST_MODIFIED,
  SOURCE_METADATA_UPDATED,
  SOURCE_URL,
} from "./data/marylandBudget";
import {
  BUDGET_COVERAGE_SOURCES,
  COVERAGE_IMPLEMENTATION_STEPS,
} from "./data/marylandBudgetCoverage";
import {
  EDUCATION_BUDGET_MATCHERS,
  EDUCATION_EQUITY_GAPS,
  EDUCATION_OUTCOME_METRICS,
  EDUCATION_OUTCOME_SOURCES,
  EDUCATION_OUTCOME_SUMMARY,
} from "./data/marylandEducationOutcomes";
import "./App.css";

const ROW_LIMITS = ["50", "100", "250", "all"];
const ANALYSIS_MODES = [
  {
    value: "overview",
    label: "Budget Overview",
  },
  {
    value: "drilldown",
    label: "Category Drilldown",
  },
  {
    value: "accountability",
    label: "Outcome Check",
  },
  {
    value: "coverage",
    label: "Coverage Map",
  },
];
const QUESTION_OPTIONS = [
  {
    value: "latest",
    label: "Latest budget allocations",
    description: "Uses the selected fiscal year from the operating-budget source.",
  },
  {
    value: "completed_actual",
    label: "Last completed actual years",
    description: "Limits rows to source records labeled as actual budget stage.",
  },
  {
    value: "general_fund",
    label: "Tax-funded General Fund only",
    description: "Limits rows to fund types that include General Fund.",
  },
  {
    value: "all_funds",
    label: "All funds",
    description: "Shows all fund types represented in the selected fiscal year.",
  },
  {
    value: "vendor_payments",
    label: "Vendor payments",
    description: "Shows the official vendor-payment source status and exclusions.",
  },
  {
    value: "education_outcomes",
    label: "Education outcomes",
    description: "Shows verified education outcomes beside the selected budget context.",
  },
];
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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function budgetStageIncludes(year, stage) {
  const stages = year.budgetStages || [year.budgetStage];
  return stages.some((value) => String(value || "").includes(stage));
}

function matchesQuestion(row, questionMode) {
  if (questionMode === "completed_actual") {
    return row.budgetStage === "Actual";
  }

  if (questionMode === "general_fund") {
    return row.fundType.toLowerCase().includes("general");
  }

  if (questionMode === "vendor_payments") {
    return false;
  }

  return true;
}

function getQuestionNotice(questionMode, selectedYearLabel) {
  if (questionMode === "completed_actual") {
    return `Showing records labeled Actual for ${selectedYearLabel}. Budget allocations and actual expenditures are related but not the same as vendor payments.`;
  }

  if (questionMode === "general_fund") {
    return "Showing records whose fund type includes General Fund. This is closer to tax-supported spending than an all-funds view, but it is still budget allocation data.";
  }

  if (questionMode === "vendor_payments") {
    return "Vendor payments use a separate official source. The coverage map shows availability, exclusions, and adapter status.";
  }

  if (questionMode === "education_outcomes") {
    return "Showing verified statewide education outcomes beside selected-year budget context. Budget allocations alone do not prove causation.";
  }

  if (questionMode === "all_funds") {
    return "Showing all fund types represented in the selected operating-budget fiscal year.";
  }

  return "Showing the selected fiscal year's operating-budget allocations from the official Maryland source.";
}

function getEducationSource(sourceId) {
  return (
    EDUCATION_OUTCOME_SOURCES.find((source) => source.id === sourceId) ||
    EDUCATION_OUTCOME_SOURCES[0]
  );
}

function isEducationBudgetRow(row) {
  const haystack = [
    row.agencyName,
    row.unitName,
    row.programName,
    row.subprogramName,
    row.categoryTitle,
  ]
    .join(" ")
    .toLowerCase();

  return EDUCATION_BUDGET_MATCHERS.some((matcher) =>
    haystack.includes(matcher.toLowerCase())
  );
}

function getCoverageSource(sourceId) {
  return (
    BUDGET_COVERAGE_SOURCES.find((source) => source.id === sourceId) ||
    BUDGET_COVERAGE_SOURCES[0]
  );
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

function StageBadge({ stage }) {
  return <span className="stage-badge">{stage || "Unknown"}</span>;
}

function ConfidenceBadge({ confidence }) {
  return <span className="confidence-badge">{confidence || "Unknown"}</span>;
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

function ModeTabs({ activeMode, onChange }) {
  return (
    <nav className="mode-tabs" aria-label="Analysis mode">
      {ANALYSIS_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          className={activeMode === mode.value ? "mode-tab active" : "mode-tab"}
          aria-current={activeMode === mode.value ? "page" : undefined}
          onClick={() => onChange(mode.value)}
        >
          {mode.label}
        </button>
      ))}
    </nav>
  );
}

function DataCoveragePanels({ metadata, budgetStage }) {
  return (
    <section className="info-grid" aria-label="Data coverage and limitations">
      <article className="info-panel">
        <span>Data coverage</span>
        <p>{metadata.coverage}</p>
      </article>

      <article className="info-panel">
        <span>Source confidence</span>
        <div className="confidence-line">
          <ConfidenceBadge confidence={metadata.confidence} />
          <strong>{budgetStage || "Unknown stage"}</strong>
        </div>
        <p>{metadata.confidenceReason}</p>
      </article>

      <article className="info-panel">
        <span>Known missing pieces</span>
        <ul>
          {metadata.knownExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function QuestionNotice({ questionMode, selectedYearLabel }) {
  return (
    <section
      className={
        questionMode === "vendor_payments" || questionMode === "education_outcomes"
          ? "question-notice warning"
          : "question-notice"
      }
      aria-live="polite"
    >
      {getQuestionNotice(questionMode, selectedYearLabel)}
    </section>
  );
}

function ResultBadge({ result }) {
  const tone = String(result || "Unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`result-badge result-${tone}`}>{result || "Unknown"}</span>;
}

function CoverageStatusBadge({ status }) {
  const tone = String(status || "unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`coverage-status status-${tone}`}>{status || "Unknown"}</span>;
}

function OutcomeMetricCard({ metric }) {
  const source = getEducationSource(metric.sourceId);

  return (
    <article className="outcome-card">
      <div className="outcome-card-top">
        <span>{metric.group}</span>
        <ResultBadge result={metric.result} />
      </div>
      <strong>{metric.value}</strong>
      <h3>{metric.label}</h3>
      <p>{metric.comparison}</p>
      <a href={source.url} target="_blank" rel="noreferrer">
        {source.label}
      </a>
    </article>
  );
}

function AccountabilityPanel({ budgetDetail }) {
  const educationRows = budgetDetail?.allocations.filter(isEducationBudgetRow) || [];
  const educationTotal = educationRows.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );
  const educationShare =
    budgetDetail?.totalAmount > 0
      ? (educationTotal / budgetDetail.totalAmount) * 100
      : 0;
  const topEducationPrograms = getGroupedTotals(
    educationRows,
    "programName",
    educationTotal,
    6
  );

  return (
    <section className="panel accountability-panel">
      <div className="panel-heading">
        <div>
          <h2>Education Outcome Accountability</h2>
          <p>
            Verified statewide education outcomes are shown beside the selected
            operating-budget year. The rating is evidence context, not a claim
            that a budget line caused an outcome.
          </p>
        </div>
        <ResultBadge result={EDUCATION_OUTCOME_SUMMARY.rating} />
      </div>

      <div className="accountability-summary-grid">
        <MetricCard
          label={`FY ${budgetDetail?.fiscalYear || ""} education context`}
          value={formatMoney(educationTotal)}
          detail={`${formatPercent(educationShare)} of selected operating-budget total`}
        />
        <MetricCard
          label={EDUCATION_OUTCOME_SUMMARY.label}
          value={EDUCATION_OUTCOME_SUMMARY.rating}
          detail={EDUCATION_OUTCOME_SUMMARY.period}
        />
        <MetricCard
          label="Verified outcome sources"
          value={formatNumber(EDUCATION_OUTCOME_SOURCES.length)}
          detail="MSDE and NCES/NAEP public releases"
        />
      </div>

      <section className="evidence-panel">
        <div>
          <h3>Interpretation</h3>
          <p>{EDUCATION_OUTCOME_SUMMARY.rationale}</p>
        </div>
        <div>
          <h3>Guardrail</h3>
          <p>{EDUCATION_OUTCOME_SUMMARY.guardrail}</p>
        </div>
      </section>

      <div className="outcome-grid">
        {EDUCATION_OUTCOME_METRICS.map((metric) => (
          <OutcomeMetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <section className="accountability-grid">
        <article>
          <h3>Largest Education Budget Lines</h3>
          <div className="mini-list">
            {topEducationPrograms.map((row) => (
              <div className="mini-row" key={row.name}>
                <span>{row.name}</span>
                <strong>
                  {formatMoney(row.dollarAmount)}
                  <small>{formatPercent(row.percentage)}</small>
                </strong>
              </div>
            ))}
          </div>
        </article>
        <article>
          <h3>Equity Gaps To Track</h3>
          <div className="gap-list">
            {EDUCATION_EQUITY_GAPS.map((gap) => {
              const source = getEducationSource(gap.sourceId);

              return (
                <a key={gap.id} href={source.url} target="_blank" rel="noreferrer">
                  <span>{gap.label}</span>
                  <strong>{gap.value}</strong>
                </a>
              );
            })}
          </div>
        </article>
      </section>

      <footer className="panel-footnote">
        Outcome sources are official MSDE and NCES/NAEP releases. Missing Phase
        2 items still include postsecondary degree completion, student debt,
        employment, and research outcomes.
      </footer>
    </section>
  );
}

function BudgetCoveragePanel({ selectedSourceId, onSelectSourceId }) {
  const selectedSource = getCoverageSource(selectedSourceId);
  const liveSources = BUDGET_COVERAGE_SOURCES.filter(
    (source) => source.status === "Live"
  ).length;

  return (
    <section className="panel coverage-panel">
      <div className="panel-heading">
        <div>
          <h2>All-Budget Coverage Map</h2>
          <p>
            Phase 3 tracks which official sources are live, which are identified,
            and what each source can and cannot explain.
          </p>
        </div>
        <CoverageStatusBadge status={selectedSource.status} />
      </div>

      <div className="coverage-summary-grid">
        <MetricCard
          label="Official sources mapped"
          value={formatNumber(BUDGET_COVERAGE_SOURCES.length)}
          detail="State, portal, and local-source categories"
        />
        <MetricCard
          label="Live adapters"
          value={formatNumber(liveSources)}
          detail="Operating budget is connected now"
        />
        <MetricCard
          label="Selected source"
          value={selectedSource.adapter}
          detail={selectedSource.confidence} 
        />
      </div>

      <div className="coverage-layout">
        <div className="coverage-source-list" aria-label="Coverage sources">
          {BUDGET_COVERAGE_SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              className={
                source.id === selectedSource.id
                  ? "coverage-source active"
                  : "coverage-source"
              }
              onClick={() => onSelectSourceId(source.id)}
            >
              <span>{source.label}</span>
              <CoverageStatusBadge status={source.status} />
            </button>
          ))}
        </div>

        <article className="coverage-detail">
          <div className="coverage-detail-heading">
            <div>
              <span>{selectedSource.adapter}</span>
              <h3>{selectedSource.label}</h3>
            </div>
            <ConfidenceBadge confidence={selectedSource.confidence} />
          </div>
          <p>{selectedSource.adds}</p>
          <p>{selectedSource.availability}</p>
          <a href={selectedSource.sourceUrl} target="_blank" rel="noreferrer">
            {selectedSource.sourceLabel}
          </a>
          {selectedSource.secondaryUrl && (
            <a href={selectedSource.secondaryUrl} target="_blank" rel="noreferrer">
              Department of Legislative Services capital resources
            </a>
          )}
          <ul>
            {selectedSource.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="coverage-step-list">
        {COVERAGE_IMPLEMENTATION_STEPS.map((step) => (
          <article key={step.phase}>
            <span>{step.phase}</span>
            <strong>{step.label}</strong>
            <CoverageStatusBadge status={step.status} />
            <p>{step.detail}</p>
          </article>
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
            key={`${row.agencyName}-${row.unitName}-${row.programName}-${row.subprogramName}-${row.categoryTitle}-${row.fundType}-${row.budgetStage}-${index}`}
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
                {row.unitName} / {row.fundType} / {row.budgetStage} /{" "}
                {formatPercent(row.percentage)}
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
  const [sourceMetadata, setSourceMetadata] = useState(DEFAULT_SOURCE_METADATA);
  const [budgetYears, setBudgetYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [budgetDetail, setBudgetDetail] = useState(null);
  const [analysisMode, setAnalysisMode] = useState("overview");
  const [questionMode, setQuestionMode] = useState("latest");
  const [coverageSourceId, setCoverageSourceId] = useState("operating-budget");
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [traceMessage, setTraceMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [fundFilter, setFundFilter] = useState("all");
  const [budgetStageFilter, setBudgetStageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("amount");
  const [rowLimit, setRowLimit] = useState("100");
  const selectedState = STATE_BY_CODE[selectedStateCode];
  const activeState = STATE_BY_CODE[activeStateCode];
  const canOpenSelectedState = Boolean(selectedState?.isConnected);

  function resetFilters() {
    setSearchQuery("");
    setAgencyFilter("all");
    setFundFilter("all");
    setBudgetStageFilter("all");
    setCategoryFilter("all");
    setQuestionMode("latest");
    setAnalysisMode("overview");
    setCoverageSourceId("operating-budget");
    setSortMode("amount");
    setRowLimit("100");
    setTraceMessage("");
  }

  function clearBudgetData() {
    setBudgetYears([]);
    setSelectedYear("");
    setBudgetDetail(null);
    setSourceMetadata(DEFAULT_SOURCE_METADATA);
    setErrorMessage("");
    setTraceMessage("");
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

  function handleQuestionModeChange(value) {
    setQuestionMode(value);
    setTraceMessage("");

    if (value === "education_outcomes") {
      setAnalysisMode("accountability");
    } else if (value === "vendor_payments") {
      setAnalysisMode("coverage");
      setCoverageSourceId("vendor-payments");
    } else if (analysisMode === "accountability" || analysisMode === "coverage") {
      setAnalysisMode("overview");
    }

    if (value === "completed_actual") {
      const latestActualYear = budgetYears.find((year) =>
        budgetStageIncludes(year, "Actual")
      );

      if (latestActualYear) {
        setSelectedYear(String(latestActualYear.fiscalYear));
      }
    }
  }

  function handleTrace(row) {
    setTraceMessage(
      `${row.sourceLabel}: FY ${row.fiscalYear}, ${row.budgetStage}, ${row.agencyName} / ${row.unitName} / ${row.programName} / ${row.subprogramName}. ${row.fundType}: ${formatFullMoney(row.dollarAmount)} (${formatPercent(row.percentage)} of selected-year total). Confidence: ${row.confidence}.`
    );
  }

  useEffect(() => {
    if (!activeStateCode) return undefined;

    const controller = new AbortController();

    async function loadYears() {
      setLoadingYears(true);
      setErrorMessage("");

      try {
        const payload = await fetchBudgetYears(controller.signal);
        const years = payload.years;

        if (!years.length) {
          throw new Error("No Maryland budget years were returned.");
        }

        setSourceMetadata(payload.metadata);
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
      setBudgetStageFilter("all");
      setCategoryFilter("all");
      setTraceMessage("");

      try {
        const detail = await fetchBudgetDetail(
          Number(selectedYear),
          controller.signal
        );

        if (!detail?.allocations?.length) {
          throw new Error(`No budget allocations were returned for FY ${selectedYear}.`);
        }

        setSourceMetadata(detail.metadata || DEFAULT_SOURCE_METADATA);
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

  const budgetStageOptions = useMemo(() => {
    if (!budgetDetail) return [];

    return [...new Set(budgetDetail.allocations.map((row) => row.budgetStage))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [budgetDetail]);

  const categoryOptions = useMemo(() => {
    if (!budgetDetail) return [];

    return [...new Set(budgetDetail.allocations.map((row) => row.categoryTitle))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [budgetDetail]);

  const filteredRows = useMemo(() => {
    if (!budgetDetail) return [];

    const query = searchQuery.trim().toLowerCase();
    const rows = budgetDetail.allocations.filter((row) => {
      const matchesAgency =
        agencyFilter === "all" || row.agencyName === agencyFilter;
      const matchesFund = fundFilter === "all" || row.fundType === fundFilter;
      const matchesStage =
        budgetStageFilter === "all" || row.budgetStage === budgetStageFilter;
      const matchesCategory =
        categoryFilter === "all" || row.categoryTitle === categoryFilter;
      const matchesSearch =
        !query ||
        row.agencyName.toLowerCase().includes(query) ||
        row.unitName.toLowerCase().includes(query) ||
        row.programName.toLowerCase().includes(query) ||
        row.subprogramName.toLowerCase().includes(query) ||
        row.categoryTitle.toLowerCase().includes(query) ||
        row.fundType.toLowerCase().includes(query) ||
        row.budgetStage.toLowerCase().includes(query);
      const matchesSelectedQuestion = matchesQuestion(row, questionMode);

      return (
        matchesAgency &&
        matchesFund &&
        matchesStage &&
        matchesCategory &&
        matchesSearch &&
        matchesSelectedQuestion
      );
    });

    return sortRows(rows, sortMode);
  }, [
    agencyFilter,
    budgetDetail,
    budgetStageFilter,
    categoryFilter,
    fundFilter,
    questionMode,
    searchQuery,
    sortMode,
  ]);

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
  const metadata = budgetDetail?.metadata || sourceMetadata || DEFAULT_SOURCE_METADATA;
  const activeQuestion =
    QUESTION_OPTIONS.find((option) => option.value === questionMode) ||
    QUESTION_OPTIONS[0];
  const isUnsupportedQuestion = questionMode === "vendor_payments";
  const hidesAllocationTable =
    questionMode === "vendor_payments" || questionMode === "education_outcomes";
  const showsAllocationViews =
    analysisMode !== "accountability" &&
    analysisMode !== "coverage" &&
    !hidesAllocationTable;
  const hasActiveFilters =
    searchQuery.trim() ||
    agencyFilter !== "all" ||
    fundFilter !== "all" ||
    budgetStageFilter !== "all" ||
    categoryFilter !== "all" ||
    questionMode !== "latest" ||
    sortMode !== "amount" ||
    rowLimit !== "100";

  function exportFilteredCsv() {
    if (!displayedRows.length) return;

    const headers = [
      "Fiscal Year",
      "Budget Stage",
      "Agency",
      "Department",
      "Program",
      "Subprogram",
      "Category",
      "Fund Type",
      "Amount",
      "% Selected Total",
      "Source",
      "Confidence",
      "Notes",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...displayedRows.map((row) =>
        [
          row.fiscalYear,
          row.budgetStage,
          row.agencyName,
          row.unitName,
          row.programName,
          row.subprogramName,
          row.categoryTitle,
          row.fundType,
          row.dollarAmount,
          row.percentage.toFixed(4),
          row.sourceLabel,
          row.confidence,
          row.notes,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maryland-budget-${selectedYearLabel.toLowerCase().replace(/\s+/g, "-")}-filtered.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTraceMessage(`Exported ${displayedRows.length} visible rows as CSV.`);
  }

  async function copySourceCitation() {
    const citation = `${metadata.sourceLabel}. Maryland Open Data. ${metadata.sourceUrl}. Data last modified ${SOURCE_LAST_MODIFIED}; metadata updated ${SOURCE_METADATA_UPDATED}.`;

    try {
      await navigator.clipboard.writeText(citation);
      setTraceMessage("Source citation copied.");
    } catch {
      setTraceMessage(citation);
    }
  }

  if (!activeState) {
    return (
      <main className="page page-centered">
        <section className="welcome-screen">
          <div className="welcome-copy">
            <p className="eyebrow">Public spending accountability</p>
            <h1>Choose a state budget to explore</h1>
            <p>
              Explore official state budget allocations and prepare them for
              comparison with public outcomes. Maryland operating-budget and
              education outcome context are connected first.
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
            Explore official operating-budget allocations by year, stage, agency,
            program, category, and fund type. Education outcomes are connected
            through official MSDE and NCES/NAEP releases, and broader budget
            sources are mapped separately.
          </p>
        </div>

        <aside className="source-panel" aria-label="Official data source">
          <span>Selected state</span>
          <strong>{activeState.name}</strong>
          <span>Official source</span>
          <a href={metadata.sourceUrl || SOURCE_URL} target="_blank" rel="noreferrer">
            {metadata.sourceLabel || SOURCE_LABEL}
          </a>
          <span>Confidence</span>
          <ConfidenceBadge confidence={metadata.confidence} />
          <small>Data last modified {SOURCE_LAST_MODIFIED}</small>
          <small>Metadata updated {SOURCE_METADATA_UPDATED}</small>
          {budgetDetail?.budgetStage && (
            <>
              <span>Budget stage</span>
              <StageBadge stage={budgetDetail.budgetStage} />
            </>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={copySourceCitation}
          >
            Copy citation
          </button>
          <button type="button" className="secondary-button" onClick={changeState}>
            Change state
          </button>
        </aside>
      </header>

      <ModeTabs activeMode={analysisMode} onChange={setAnalysisMode} />

      <section className="toolbar" aria-label="Budget controls">
        <div className="control-field control-field-wide">
          <label htmlFor="question-select">Question</label>
          <select
            id="question-select"
            value={questionMode}
            onChange={(event) => handleQuestionModeChange(event.target.value)}
            disabled={!activeStateCode}
          >
            {QUESTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
                FY {year.fiscalYear} / {year.budgetStage || "Unknown"}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field control-field-wide">
          <label htmlFor="search-input">Search</label>
          <input
            id="search-input"
            type="search"
            placeholder="Agency, unit, program, category, or fund"
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
          <label htmlFor="stage-filter">Budget stage</label>
          <select
            id="stage-filter"
            value={budgetStageFilter}
            onChange={(event) => setBudgetStageFilter(event.target.value)}
            disabled={!budgetDetail}
          >
            <option value="all">All stages</option>
            {budgetStageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
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
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            disabled={!budgetDetail}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
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

      <QuestionNotice
        questionMode={questionMode}
        selectedYearLabel={selectedYearLabel}
      />

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
          <DataCoveragePanels
            metadata={metadata}
            budgetStage={budgetDetail.budgetStage}
          />

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
              label="Grouped allocations returned"
              value={formatNumber(budgetDetail.allocations.length)}
              detail={`Top grouped rows by amount, capped at ${formatNumber(
                budgetDetail.allocationLimit
              )}`}
            />
            <MetricCard
              label="Budget stage"
              value={budgetDetail.budgetStage}
              detail="Normalized from the source type field"
            />
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? "Operating-budget match total"
                  : "Current filter total"
              }
              value={formatMoney(filteredTotal)}
              detail={
                questionMode === "vendor_payments"
                  ? "Vendor payments require the separate source shown below"
                  : `${formatNumber(filteredRows.length)} matching allocations`
              }
            />
          </section>

          {traceMessage && (
            <section className="trace-panel" aria-live="polite">
              {traceMessage}
            </section>
          )}

          {(analysisMode === "accountability" ||
            questionMode === "education_outcomes") && (
            <AccountabilityPanel budgetDetail={budgetDetail} />
          )}

          {(analysisMode === "coverage" || questionMode === "vendor_payments") && (
            <BudgetCoveragePanel
              selectedSourceId={coverageSourceId}
              onSelectSourceId={setCoverageSourceId}
            />
          )}

          {isUnsupportedQuestion && (
            <section className="unsupported-panel">
              <strong>{activeQuestion.label}</strong>
              <p>{activeQuestion.description}</p>
              <p>
                The current operating-budget table is intentionally hidden for
                this question because payments come from a different official
                source with different thresholds and exclusions.
              </p>
            </section>
          )}

          {showsAllocationViews && (
            <section className="dashboard-grid">
            <section className="panel panel-large">
              <div className="panel-heading">
                <div>
                  <h2>
                    {analysisMode === "drilldown"
                      ? "Largest Category Allocations"
                      : "Largest Program Allocations"}
                  </h2>
                  <p>
                    {activeQuestion.description} Top results after active
                    filters, sorted by amount.
                  </p>
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
          )}

          {showsAllocationViews && (
          <section className="table-panel">
            <div className="panel-heading">
              <div>
                <h2>Allocation Detail</h2>
                <p>
                  Showing {formatNumber(displayedRows.length)} of{" "}
                  {formatNumber(filteredRows.length)} matching grouped rows.
                  {budgetDetail.isAllocationCapped
                    ? ` Summary totals use all source line items; the table returns the top ${formatNumber(
                        budgetDetail.allocationLimit
                      )} grouped rows.`
                    : ""}
                </p>
              </div>
              {selectedYearSummary && (
                <span>{formatMoney(filteredTotal)}</span>
              )}
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={exportFilteredCsv}
                disabled={!displayedRows.length}
              >
                Export visible CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={copySourceCitation}
              >
                Copy source summary
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fiscal Year</th>
                    <th>Budget Stage</th>
                    <th>Agency</th>
                    <th>Department</th>
                    <th>Program</th>
                    <th>Subprogram</th>
                    <th>Category</th>
                    <th>Fund Type</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>Confidence</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, index) => (
                    <tr
                      key={`${row.agencyName}-${row.unitName}-${row.programName}-${row.subprogramName}-${row.categoryTitle}-${row.fundType}-${row.budgetStage}-${index}`}
                    >
                      <td>FY {row.fiscalYear}</td>
                      <td>
                        <StageBadge stage={row.budgetStage} />
                      </td>
                      <td>{row.agencyName}</td>
                      <td>{row.unitName}</td>
                      <td>{row.programName}</td>
                      <td>{row.subprogramName}</td>
                      <td>{row.categoryTitle}</td>
                      <td>{row.fundType}</td>
                      <td>{formatFullMoney(row.dollarAmount)}</td>
                      <td>{formatPercent(row.percentage)}</td>
                      <td>
                        <ConfidenceBadge confidence={row.confidence} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="trace-button"
                          onClick={() => handleTrace(row)}
                        >
                          Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}

          <footer className="data-note">
            {metadata.limitations.join(" ")}
            {budgetDetail.isAllocationCapped
              ? ` The grouped allocation table is capped at ${formatNumber(
                  budgetDetail.allocationLimit
                )} rows; the all-line-item summary total exceeds the returned grouped rows by ${formatFullMoney(
                  budgetDetail.allocationDifference
                )}.`
              : ""}
          </footer>
        </>
      )}
    </main>
  );
}
