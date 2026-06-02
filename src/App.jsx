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
  DEFAULT_VENDOR_PAYMENT_METADATA,
  fetchVendorPaymentDetail,
  fetchVendorPaymentYears,
  VENDOR_PAYMENTS_LAST_UPDATED,
  VENDOR_PAYMENTS_METADATA_UPDATED,
} from "./data/marylandVendorPayments";
import {
  BUDGET_COVERAGE_SOURCES,
  CAPITAL_PROJECT_PIPELINE,
  COVERAGE_IMPLEMENTATION_STEPS,
  LOCAL_LAYER_SOURCES,
} from "./data/marylandBudgetCoverage";
import { BUDGET_EXPLAINERS } from "./data/budgetExplainers";
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
    value: "trends",
    label: "Year Changes",
  },
  {
    value: "compare",
    label: "Compare",
  },
  {
    value: "payments",
    label: "Vendor Payments",
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

function getQueryValue(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function getQueryOption(name, allowedValues, fallback) {
  const value = getQueryValue(name);
  return allowedValues.includes(value) ? value : fallback;
}

function getQueryStateCode() {
  const value = getQueryValue("state").toUpperCase();
  return STATE_BY_CODE[value] ? value : "";
}

function getQueryCoverageSourceId() {
  const value = getQueryValue("source");
  return BUDGET_COVERAGE_SOURCES.some((source) => source.id === value)
    ? value
    : "operating-budget";
}

function getInitialAnalysisMode() {
  const requestedMode = getQueryValue("mode");

  if (ANALYSIS_MODES.some((mode) => mode.value === requestedMode)) {
    return requestedMode;
  }

  const requestedQuestion = getQueryValue("question");

  if (requestedQuestion === "vendor_payments") return "payments";
  if (requestedQuestion === "education_outcomes") return "accountability";

  return "overview";
}

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

function formatSignedMoney(value) {
  if (value === null || value === undefined) return "Baseline";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatMoney(value)}`;
}

function formatSignedPercent(value) {
  if (value === null || value === undefined) return "Baseline";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value)}`;
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
    return "Vendor payments use the official Maryland payments dataset. These are payment records, not operating-budget allocations, and current-year values may be partial.";
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

function getYearTrendRows(budgetYears) {
  const ascendingYears = [...budgetYears].sort(
    (a, b) => a.fiscalYear - b.fiscalYear
  );

  return ascendingYears
    .map((year, index) => {
      const previousYear = ascendingYears[index - 1];
      const changeAmount = previousYear
        ? year.totalAmount - previousYear.totalAmount
        : null;
      const changePercent =
        previousYear?.totalAmount > 0
          ? (changeAmount / previousYear.totalAmount) * 100
          : null;

      return {
        ...year,
        changeAmount,
        changePercent,
        previousFiscalYear: previousYear?.fiscalYear || null,
      };
    })
    .sort((a, b) => b.fiscalYear - a.fiscalYear);
}

function getPreviousYearSummary(budgetYears, selectedYear) {
  const ascendingYears = [...budgetYears].sort(
    (a, b) => a.fiscalYear - b.fiscalYear
  );
  const selectedIndex = ascendingYears.findIndex(
    (year) => String(year.fiscalYear) === String(selectedYear)
  );

  return selectedIndex > 0 ? ascendingYears[selectedIndex - 1] : null;
}

function getCoverageScoreSummary() {
  const totalScore = BUDGET_COVERAGE_SOURCES.reduce(
    (sum, source) => sum + (source.coverageScore || 0),
    0
  );
  const averageScore = Math.round(totalScore / BUDGET_COVERAGE_SOURCES.length);
  const liveScore = BUDGET_COVERAGE_SOURCES.filter(
    (source) => source.status === "Live"
  ).reduce((sum, source) => sum + (source.coverageScore || 0), 0);

  return {
    averageScore,
    liveScore,
  };
}

function getEducationSpendContext(budgetDetail) {
  const educationRows = budgetDetail?.allocations.filter(isEducationBudgetRow) || [];
  const educationTotal = educationRows.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );
  const educationShare =
    budgetDetail?.totalAmount > 0
      ? (educationTotal / budgetDetail.totalAmount) * 100
      : 0;

  return {
    educationRows,
    educationTotal,
    educationShare,
  };
}

function buildTraceText(row, budgetDetail) {
  if (!row) return "";

  const totalAmount = row.traceTotalAmount ?? budgetDetail?.totalAmount ?? 0;
  const share = totalAmount > 0 ? (row.dollarAmount / totalAmount) * 100 : 0;
  const totalLabel = row.traceTotalLabel || "selected-year total";

  return `${row.sourceLabel}: FY ${row.fiscalYear}, ${row.budgetStage}, ${row.agencyName} / ${row.unitName} / ${row.programName} / ${row.subprogramName}. ${row.fundType}: ${formatFullMoney(row.dollarAmount)} divided by ${formatFullMoney(totalAmount)} ${totalLabel} = ${formatPercent(share)}. Confidence: ${row.confidence}.`;
}

function buildVendorTraceRow(payment, vendorPaymentDetail) {
  return {
    fiscalYear: payment.fiscalYear,
    agencyName: payment.agencyName,
    unitName: payment.category,
    programName: payment.vendorName,
    subprogramName: `${formatNumber(payment.paymentCount)} payment rows`,
    categoryTitle: payment.category,
    fundType: payment.vendorZip,
    budgetStage: "Vendor payment summary",
    sourceLabel: payment.sourceLabel,
    sourceUrl: payment.sourceUrl,
    confidence: payment.confidence,
    notes: payment.notes,
    dollarAmount: payment.dollarAmount,
    percentage: payment.percentage,
    traceType: "Vendor payment",
    traceTotalAmount: vendorPaymentDetail?.totalAmount || 0,
    traceTotalLabel: `FY ${payment.fiscalYear} vendor-payment total`,
  };
}

function getActiveFilterSummary(filters) {
  return [
    { label: "Search", value: filters.searchQuery || "None" },
    { label: "Agency", value: filters.agencyFilter === "all" ? "All" : filters.agencyFilter },
    { label: "Fund", value: filters.fundFilter === "all" ? "All" : filters.fundFilter },
    {
      label: "Stage",
      value:
        filters.budgetStageFilter === "all"
          ? "All"
          : filters.budgetStageFilter,
    },
    {
      label: "Category",
      value: filters.categoryFilter === "all" ? "All" : filters.categoryFilter,
    },
  ];
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

function CoverageScoreMeter({ score }) {
  const safeScore = Math.max(0, Math.min(score || 0, 100));

  return (
    <div className="coverage-score-meter">
      <div className="coverage-score-label">
        <span>Coverage score</span>
        <strong>{safeScore}%</strong>
      </div>
      <div className="coverage-score-track" aria-hidden="true">
        <div
          className="coverage-score-fill"
          style={{ "--score-width": `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function ExplainerPanel() {
  return (
    <section className="panel explainer-panel">
      <div className="panel-heading">
        <div>
          <h2>Plain-English Budget Terms</h2>
          <p>
            Short definitions for the terms that change how a spending number
            should be read.
          </p>
        </div>
      </div>

      <div className="explainer-grid">
        {BUDGET_EXPLAINERS.map((item) => (
          <article key={item.term}>
            <span>{item.term}</span>
            <p>{item.plain}</p>
            <small>{item.whyItMatters}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function YearTrendPanel({ budgetYears, selectedYear }) {
  const trendRows = getYearTrendRows(budgetYears);
  const maxAmount = Math.max(...trendRows.map((year) => year.totalAmount), 0);
  const comparableRows = trendRows.filter(
    (year) => year.changeAmount !== null && year.changeAmount !== undefined
  );
  const selectedTrend = trendRows.find(
    (year) => String(year.fiscalYear) === String(selectedYear)
  );
  const largestIncrease = [...comparableRows].sort(
    (a, b) => b.changeAmount - a.changeAmount
  )[0];

  return (
    <section className="panel trend-panel">
      <div className="panel-heading">
        <div>
          <h2>Year-Over-Year Budget Change</h2>
          <p>
            Operating-budget totals by fiscal year from the connected Maryland
            source. Budget-stage labels stay visible because not every year has
            the same meaning.
          </p>
        </div>
        {selectedTrend && <StageBadge stage={selectedTrend.budgetStage} />}
      </div>

      <div className="comparison-grid">
        <MetricCard
          label="Selected fiscal year"
          value={formatMoney(selectedTrend?.totalAmount || 0)}
          detail={`FY ${selectedTrend?.fiscalYear || selectedYear}`}
        />
        <MetricCard
          label="Change from prior year"
          value={formatSignedMoney(selectedTrend?.changeAmount)}
          detail={formatSignedPercent(selectedTrend?.changePercent)}
        />
        <MetricCard
          label="Largest increase in source"
          value={formatSignedMoney(largestIncrease?.changeAmount)}
          detail={
            largestIncrease
              ? `FY ${largestIncrease.fiscalYear} from FY ${largestIncrease.previousFiscalYear}`
              : "Needs at least two years"
          }
        />
      </div>

      <div className="trend-list">
        {trendRows.map((year) => {
          const width =
            maxAmount > 0 ? Math.max((year.totalAmount / maxAmount) * 100, 2) : 2;
          const isSelected = String(year.fiscalYear) === String(selectedYear);

          return (
            <article
              key={year.fiscalYear}
              className={isSelected ? "trend-row active" : "trend-row"}
            >
              <div>
                <strong>FY {year.fiscalYear}</strong>
                <span>{year.budgetStage}</span>
              </div>
              <div className="trend-bar-track" aria-hidden="true">
                <div
                  className="trend-bar-fill"
                  style={{ "--trend-width": `${width}%` }}
                />
              </div>
              <div>
                <strong>{formatMoney(year.totalAmount)}</strong>
                <span>
                  {year.previousFiscalYear
                    ? `${formatSignedMoney(year.changeAmount)} / ${formatSignedPercent(
                        year.changePercent
                      )}`
                    : "Baseline"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EfficiencyPanel({ budgetDetail }) {
  const { educationTotal, educationShare } = getEducationSpendContext(budgetDetail);
  const weakOrMixedSignals = EDUCATION_OUTCOME_METRICS.filter((metric) =>
    ["Weak", "Mixed"].includes(metric.result)
  ).length;
  const strongSignals = EDUCATION_OUTCOME_METRICS.filter(
    (metric) => metric.result === "Strong"
  ).length;

  return (
    <section className="efficiency-panel">
      <div className="panel-heading compact-heading">
        <div>
          <h3>Spending vs Outcome Efficiency</h3>
          <p>
            A screening view for follow-up questions. It compares the education
            budget context with verified outcome signals without claiming
            causation.
          </p>
        </div>
      </div>

      <div className="comparison-grid">
        <MetricCard
          label="Education budget context"
          value={formatMoney(educationTotal)}
          detail={`${formatPercent(educationShare)} of selected operating budget`}
        />
        <MetricCard
          label="Weak or mixed signals"
          value={formatNumber(weakOrMixedSignals)}
          detail="MCAP and NAEP metrics needing follow-up"
        />
        <MetricCard
          label="Strong signals"
          value={formatNumber(strongSignals)}
          detail="Graduation indicator currently rated strong"
        />
      </div>
    </section>
  );
}

function ComparisonPanel({ budgetDetail, budgetYears, filteredRows, selectedYear }) {
  const previousYear = getPreviousYearSummary(budgetYears, selectedYear);
  const selectedYearSummary = budgetYears.find(
    (year) => String(year.fiscalYear) === String(selectedYear)
  );
  const previousChange = previousYear
    ? budgetDetail.totalAmount - previousYear.totalAmount
    : null;
  const previousChangePercent =
    previousYear?.totalAmount > 0
      ? (previousChange / previousYear.totalAmount) * 100
      : null;
  const filteredTotal = filteredRows.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );
  const filteredShare =
    budgetDetail.totalAmount > 0 ? (filteredTotal / budgetDetail.totalAmount) * 100 : 0;
  const { educationTotal, educationShare } = getEducationSpendContext(budgetDetail);
  const coverageScore = getCoverageScoreSummary();

  return (
    <section className="panel comparison-panel">
      <div className="panel-heading">
        <div>
          <h2>Comparison Mode</h2>
          <p>
            Compares the current view against the full selected-year operating
            budget, the prior available fiscal year, education context, and
            source coverage.
          </p>
        </div>
        <StageBadge stage={selectedYearSummary?.budgetStage || budgetDetail.budgetStage} />
      </div>

      <div className="comparison-grid">
        <MetricCard
          label="Selected vs prior FY"
          value={formatSignedMoney(previousChange)}
          detail={
            previousYear
              ? `${formatSignedPercent(previousChangePercent)} from FY ${previousYear.fiscalYear}`
              : "No prior fiscal year in source"
          }
        />
        <MetricCard
          label="Current filtered view"
          value={formatMoney(filteredTotal)}
          detail={`${formatPercent(filteredShare)} of FY ${budgetDetail.fiscalYear}`}
        />
        <MetricCard
          label="Education spending context"
          value={formatMoney(educationTotal)}
          detail={`${formatPercent(educationShare)} of selected FY total`}
        />
        <MetricCard
          label="Average source coverage"
          value={`${coverageScore.averageScore}%`}
          detail={`${coverageScore.liveScore}% live-source score already connected`}
        />
      </div>

      <div className="benchmark-grid">
        {EDUCATION_OUTCOME_METRICS.slice(0, 4).map((metric) => (
          <article key={metric.id}>
            <span>{metric.group}</span>
            <strong>{metric.value}</strong>
            <p>{metric.label}</p>
            <ResultBadge result={metric.result} />
          </article>
        ))}
      </div>
    </section>
  );
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
  const { educationRows, educationTotal, educationShare } =
    getEducationSpendContext(budgetDetail);
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

      <EfficiencyPanel budgetDetail={budgetDetail} />

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
  const coverageScore = getCoverageScoreSummary();

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
          label="Average coverage score"
          value={`${coverageScore.averageScore}%`}
          detail="Across live and mapped source categories"
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
          <CoverageScoreMeter score={selectedSource.coverageScore} />
          <p>{selectedSource.adds}</p>
          <p>{selectedSource.availability}</p>
          <CoverageStatusBadge status={selectedSource.phase} />
          <a href={selectedSource.sourceUrl} target="_blank" rel="noreferrer">
            {selectedSource.sourceLabel}
          </a>
          {selectedSource.secondaryUrl && (
            <a href={selectedSource.secondaryUrl} target="_blank" rel="noreferrer">
              {selectedSource.secondaryLabel || "Secondary source"}
            </a>
          )}
          <ul>
            {selectedSource.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="source-task-grid">
            <div>
              <h4>Adapter Tasks</h4>
              <ul>
                {selectedSource.adapterTasks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Reconciliation Keys</h4>
              <ul>
                {selectedSource.reconciliationKeys.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>

      <div className="source-buildout-grid">
        <section>
          <div className="coverage-detail-heading">
            <div>
              <span>Capital project explorer</span>
              <h3>Project Normalization Pipeline</h3>
            </div>
            <CoverageStatusBadge status="Planned" />
          </div>
          <div className="mini-list">
            {CAPITAL_PROJECT_PIPELINE.map((item) => (
              <div className="mini-row" key={item.label}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <CoverageStatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="coverage-detail-heading">
            <div>
              <span>County and district layer</span>
              <h3>Local Education Source Plan</h3>
            </div>
            <CoverageStatusBadge status="Source identified" />
          </div>
          <div className="mini-list">
            {LOCAL_LAYER_SOURCES.map((item) => (
              <div className="mini-row" key={item.label}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <CoverageStatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="coverage-step-list">
        {COVERAGE_IMPLEMENTATION_STEPS.map((step) => (
          <article key={step.phase}>
            <span>{step.phase}</span>
            <strong>{step.label}</strong>
            <CoverageStatusBadge status={step.status} />
            <p>{step.detail}</p>
            <ul>
              {step.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
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

function PaymentBars({ rows }) {
  const maxAmount = rows[0]?.dollarAmount || 0;

  if (!rows.length) {
    return <p className="empty-state">No vendor payments match the current filters.</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row, index) => {
        const width = maxAmount > 0 ? (row.dollarAmount / maxAmount) * 100 : 0;

        return (
          <div
            className="bar-row"
            key={`${row.fiscalYear}-${row.agencyName}-${row.vendorName}-${row.category}-${row.vendorZip}-${index}`}
          >
            <div className="bar-row-top">
              <span>{row.vendorName}</span>
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
                {row.category} / {row.vendorZip} /{" "}
                {formatNumber(row.paymentCount)} rows /{" "}
                {formatPercent(row.percentage)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VendorPaymentsPanel({
  vendorPaymentYears,
  selectedVendorYear,
  onSelectedVendorYearChange,
  vendorSearchQuery,
  onVendorSearchQueryChange,
  vendorAgencyFilter,
  onVendorAgencyFilterChange,
  vendorCategoryFilter,
  onVendorCategoryFilterChange,
  vendorPaymentDetail,
  loading,
  errorMessage,
  onTracePayment,
  onExportPayments,
  onCopyCitation,
  onCopyViewLink,
}) {
  const metadata = vendorPaymentDetail?.metadata || DEFAULT_VENDOR_PAYMENT_METADATA;
  const payments = vendorPaymentDetail?.payments || [];
  const topPaymentRows = payments.slice(0, 10);
  const topVendor = vendorPaymentDetail?.topVendors?.[0];
  const agencyOptions = vendorPaymentDetail?.topAgencies || [];
  const categoryOptions = vendorPaymentDetail?.categories || [];

  return (
    <section className="vendor-payment-section">
      <section className="panel vendor-overview-panel">
        <div className="panel-heading">
        <div>
          <h2>Vendor Payment Explorer</h2>
          <p>
            Search official Maryland payment summaries by vendor, agency,
            category/code, and fiscal year. These are payment records, not budget
            allocations.
          </p>
        </div>
        <CoverageStatusBadge status="Live" />
      </div>

      <div className="vendor-source-strip">
        <div>
          <span>Official source</span>
          <a href={metadata.sourceUrl} target="_blank" rel="noreferrer">
            {metadata.sourceLabel}
          </a>
        </div>
        <div>
          <span>Updated</span>
          <strong>{metadata.dataLastUpdated}</strong>
        </div>
        <div>
          <span>Frequency</span>
          <strong>{metadata.updateFrequency}</strong>
        </div>
        <div>
          <span>Portal</span>
          <a href={metadata.transparencyPortalUrl} target="_blank" rel="noreferrer">
            Vendor payments
          </a>
        </div>
      </div>

      <div className="vendor-controls" aria-label="Vendor payment controls">
        <div className="control-field">
          <label htmlFor="vendor-year-select">Payment fiscal year</label>
          <select
            id="vendor-year-select"
            value={selectedVendorYear}
            onChange={(event) => onSelectedVendorYearChange(event.target.value)}
            disabled={loading || !vendorPaymentYears.length}
          >
            {vendorPaymentYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field control-field-wide">
          <label htmlFor="vendor-search-input">Vendor search</label>
          <input
            id="vendor-search-input"
            type="search"
            placeholder="Vendor, agency, or category/code"
            value={vendorSearchQuery}
            onChange={(event) => onVendorSearchQueryChange(event.target.value)}
            disabled={loading || !selectedVendorYear}
          />
        </div>

        <div className="control-field">
          <label htmlFor="vendor-agency-filter">Payment agency</label>
          <select
            id="vendor-agency-filter"
            value={vendorAgencyFilter}
            onChange={(event) => onVendorAgencyFilterChange(event.target.value)}
            disabled={loading || !vendorPaymentDetail}
          >
            <option value="all">All agencies</option>
            {agencyOptions.map((agency) => (
              <option key={agency.name} value={agency.name}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="vendor-category-filter">Payment category/code</label>
          <select
            id="vendor-category-filter"
            value={vendorCategoryFilter}
            onChange={(event) => onVendorCategoryFilterChange(event.target.value)}
            disabled={loading || !vendorPaymentDetail}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <section className="loading-panel vendor-loading-panel" aria-live="polite">
          <div className="spinner" />
          <p>Loading FY {selectedVendorYear || ""} vendor payments...</p>
        </section>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      </section>

      {vendorPaymentDetail && !loading && (
        <>
          <div className="comparison-grid">
            <MetricCard
              label={`FY ${vendorPaymentDetail.fiscalYear} payment total`}
              value={formatMoney(vendorPaymentDetail.totalAmount)}
              detail={formatFullMoney(vendorPaymentDetail.totalAmount)}
            />
            <MetricCard
              label="Payment rows in source"
              value={formatNumber(vendorPaymentDetail.rowCount)}
              detail="Rows after payment filters"
            />
            <MetricCard
              label="Grouped payments returned"
              value={formatNumber(payments.length)}
              detail={`Top grouped vendor rows, capped at ${formatNumber(
                vendorPaymentDetail.paymentLimit
              )}`}
            />
            <MetricCard
              label="Top vendor in view"
              value={topVendor ? formatMoney(topVendor.dollarAmount) : "$0"}
              detail={topVendor?.name || "No vendor rows returned"}
            />
          </div>

          <section className="dashboard-grid vendor-dashboard-grid">
            <section className="panel panel-large vendor-nested-panel">
              <div className="panel-heading">
                <div>
                  <h3>Largest Vendor Payments</h3>
                  <p>
                    Grouped by agency, vendor, category/code, and ZIP after active
                    payment filters.
                  </p>
                </div>
                <span>{formatNumber(payments.length)} rows</span>
              </div>

              <PaymentBars rows={topPaymentRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown
                title="Top Vendors In View"
                rows={vendorPaymentDetail.topVendors}
              />
              <MiniBreakdown
                title="Payment Categories/Codes"
                rows={vendorPaymentDetail.categories.slice(0, 12)}
              />
            </div>
          </section>

          <section className="table-panel vendor-table-panel">
            <div className="panel-heading">
              <div>
                <h3>Vendor Payment Detail</h3>
                <p>
                  Showing {formatNumber(payments.length)} grouped rows from FY{" "}
                  {vendorPaymentDetail.fiscalYear}.
                  {vendorPaymentDetail.isPaymentCapped
                    ? ` The table returns the top ${formatNumber(
                        vendorPaymentDetail.paymentLimit
                      )} grouped payment rows.`
                    : ""}
                </p>
              </div>
              <span>{formatMoney(vendorPaymentDetail.totalAmount)}</span>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onExportPayments}
                disabled={!payments.length}
              >
                Export payment CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCopyCitation}
              >
                Copy payment source
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCopyViewLink}
              >
                Copy view link
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fiscal Year</th>
                    <th>Agency</th>
                    <th>Vendor</th>
                    <th>Category/Code</th>
                    <th>Vendor ZIP</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>Payment Rows</th>
                    <th>Confidence</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr
                      key={`${payment.fiscalYear}-${payment.agencyName}-${payment.vendorName}-${payment.category}-${payment.vendorZip}-${index}`}
                    >
                      <td>FY {payment.fiscalYear}</td>
                      <td>{payment.agencyName}</td>
                      <td>{payment.vendorName}</td>
                      <td>{payment.category}</td>
                      <td>{payment.vendorZip}</td>
                      <td>{formatFullMoney(payment.dollarAmount)}</td>
                      <td>{formatPercent(payment.percentage)}</td>
                      <td>{formatNumber(payment.paymentCount)}</td>
                      <td>
                        <ConfidenceBadge confidence={payment.confidence} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="trace-button"
                          onClick={() => onTracePayment(payment)}
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

          <footer className="panel-footnote">
            {metadata.limitations.join(" ")}
            {vendorPaymentDetail.isPaymentCapped
              ? ` The grouped vendor table is capped at ${formatNumber(
                  vendorPaymentDetail.paymentLimit
                )} rows; the all-row payment total exceeds returned grouped rows by ${formatFullMoney(
                  vendorPaymentDetail.paymentDifference
                )}.`
              : ""}
          </footer>
        </>
      )}
    </section>
  );
}

function TraceDrawer({ row, budgetDetail, filters, onClose, onCopy }) {
  if (!row) return null;

  const totalAmount = row.traceTotalAmount ?? budgetDetail?.totalAmount ?? 0;
  const share = totalAmount > 0 ? (row.dollarAmount / totalAmount) * 100 : 0;
  const activeFilters = getActiveFilterSummary(filters);
  const isVendorTrace = row.traceType === "Vendor payment";
  const totalLabel = row.traceTotalLabel || "selected-year operating budget total";

  return (
    <div className="trace-drawer-backdrop" role="presentation">
      <aside
        className="trace-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Allocation trace"
      >
        <div className="trace-drawer-heading">
          <div>
            <span>{isVendorTrace ? "Vendor payment trace" : "Allocation trace"}</span>
            <h2>{row.programName}</h2>
          </div>
          <button type="button" className="trace-close-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="trace-drawer-section">
          <span>Calculation</span>
          <strong>{formatFullMoney(row.dollarAmount)}</strong>
          <p>
            Divided by {formatFullMoney(totalAmount)} {totalLabel} equals{" "}
            {formatPercent(share)}.
          </p>
        </div>

        <div className="trace-drawer-grid">
          <div>
            <span>Fiscal year</span>
            <strong>FY {row.fiscalYear}</strong>
          </div>
          <div>
            <span>Budget stage</span>
            <StageBadge stage={row.budgetStage} />
          </div>
          <div>
            <span>Agency</span>
            <strong>{row.agencyName}</strong>
          </div>
          <div>
            <span>{isVendorTrace ? "Payment category/code" : "Department"}</span>
            <strong>{row.unitName}</strong>
          </div>
          <div>
            <span>{isVendorTrace ? "Category/code" : "Category"}</span>
            <strong>{row.categoryTitle}</strong>
          </div>
          <div>
            <span>{isVendorTrace ? "Vendor ZIP" : "Fund type"}</span>
            <strong>{row.fundType}</strong>
          </div>
        </div>

        <div className="trace-drawer-section">
          <span>Source</span>
          <a href={row.sourceUrl} target="_blank" rel="noreferrer">
            {row.sourceLabel}
          </a>
          <p>
            Confidence: {row.confidence}. Notes: {row.notes}.
          </p>
        </div>

        <div className="trace-drawer-section">
          <span>Active filters</span>
          <div className="trace-filter-grid">
            {activeFilters.map((filter) => (
              <div key={filter.label}>
                <small>{filter.label}</small>
                <strong>{filter.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => onCopy(row)}>
          Copy trace
        </button>
      </aside>
    </div>
  );
}

export default function App() {
  const [initialYearRequest] = useState(() => getQueryValue("year"));
  const [initialVendorYearRequest] = useState(() => getQueryValue("paymentYear"));
  const [hasInitialFilterParams] = useState(
    () =>
      Boolean(getQueryValue("search")) ||
      Boolean(getQueryValue("agency")) ||
      Boolean(getQueryValue("fund")) ||
      Boolean(getQueryValue("stage")) ||
      Boolean(getQueryValue("category"))
  );
  const [selectedStateCode, setSelectedStateCode] = useState(() =>
    getQueryStateCode()
  );
  const [activeStateCode, setActiveStateCode] = useState(() => {
    const stateCode = getQueryStateCode();
    return STATE_BY_CODE[stateCode]?.isConnected ? stateCode : "";
  });
  const [sourceMetadata, setSourceMetadata] = useState(DEFAULT_SOURCE_METADATA);
  const [budgetYears, setBudgetYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [budgetDetail, setBudgetDetail] = useState(null);
  const [vendorPaymentYears, setVendorPaymentYears] = useState([]);
  const [selectedVendorYear, setSelectedVendorYear] = useState("");
  const [vendorPaymentDetail, setVendorPaymentDetail] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(getInitialAnalysisMode);
  const [questionMode, setQuestionMode] = useState(() =>
    getQueryOption(
      "question",
      QUESTION_OPTIONS.map((option) => option.value),
      "latest"
    )
  );
  const [coverageSourceId, setCoverageSourceId] = useState(
    getQueryCoverageSourceId
  );
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingVendorYears, setLoadingVendorYears] = useState(false);
  const [loadingVendorPayments, setLoadingVendorPayments] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendorErrorMessage, setVendorErrorMessage] = useState("");
  const [traceMessage, setTraceMessage] = useState("");
  const [traceRow, setTraceRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState(() => getQueryValue("search"));
  const [agencyFilter, setAgencyFilter] = useState(
    () => getQueryValue("agency") || "all"
  );
  const [fundFilter, setFundFilter] = useState(
    () => getQueryValue("fund") || "all"
  );
  const [budgetStageFilter, setBudgetStageFilter] = useState(
    () => getQueryValue("stage") || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState(
    () => getQueryValue("category") || "all"
  );
  const [sortMode, setSortMode] = useState(() =>
    getQueryOption("sort", ["amount", "agency", "program"], "amount")
  );
  const [rowLimit, setRowLimit] = useState(() =>
    getQueryOption("rows", ROW_LIMITS, "100")
  );
  const [vendorSearchQuery, setVendorSearchQuery] = useState(() =>
    getQueryValue("vendorSearch")
  );
  const [vendorAgencyFilter, setVendorAgencyFilter] = useState(
    () => getQueryValue("vendorAgency") || "all"
  );
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState(
    () => getQueryValue("vendorCategory") || "all"
  );
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
    setVendorSearchQuery("");
    setVendorAgencyFilter("all");
    setVendorCategoryFilter("all");
    setTraceMessage("");
    setTraceRow(null);
  }

  function clearBudgetData() {
    setBudgetYears([]);
    setSelectedYear("");
    setBudgetDetail(null);
    setVendorPaymentYears([]);
    setSelectedVendorYear("");
    setVendorPaymentDetail(null);
    setSourceMetadata(DEFAULT_SOURCE_METADATA);
    setErrorMessage("");
    setVendorErrorMessage("");
    setTraceMessage("");
    setTraceRow(null);
    setLoadingYears(false);
    setLoadingDetail(false);
    setLoadingVendorYears(false);
    setLoadingVendorPayments(false);
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
    setTraceRow(null);

    if (value === "education_outcomes") {
      setAnalysisMode("accountability");
    } else if (value === "vendor_payments") {
      setAnalysisMode("payments");
      setCoverageSourceId("vendor-payments");
    } else if (
      analysisMode === "accountability" ||
      analysisMode === "coverage" ||
      analysisMode === "payments"
    ) {
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

  function handleAnalysisModeChange(value) {
    setAnalysisMode(value);
    setTraceMessage("");
    setTraceRow(null);

    if (value === "coverage") {
      if (questionMode === "education_outcomes") {
        setQuestionMode("latest");
      }
      return;
    }

    if (value === "payments") {
      if (questionMode !== "vendor_payments") {
        setQuestionMode("vendor_payments");
      }
      setCoverageSourceId("vendor-payments");
      return;
    }

    if (value === "accountability") {
      if (questionMode !== "education_outcomes") {
        setQuestionMode("education_outcomes");
      }
      return;
    }

    if (questionMode === "vendor_payments" || questionMode === "education_outcomes") {
      setQuestionMode("latest");
    }
  }

  function handleTrace(row) {
    setTraceRow(row);
    setTraceMessage(`Trace opened for ${row.programName}.`);
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
        const requestedYear = years.find(
          (year) => String(year.fiscalYear) === String(initialYearRequest)
        );
        setSelectedYear(String((requestedYear || years[0]).fiscalYear));
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
  }, [activeStateCode, initialYearRequest]);

  useEffect(() => {
    if (!activeStateCode || !selectedYear) return undefined;

    const controller = new AbortController();

    async function loadBudgetDetail() {
      setBudgetDetail(null);
      setLoadingDetail(true);
      setErrorMessage("");
      if (!hasInitialFilterParams) {
        setSearchQuery("");
        setAgencyFilter("all");
        setFundFilter("all");
        setBudgetStageFilter("all");
        setCategoryFilter("all");
      }
      setTraceMessage("");
      setTraceRow(null);

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
  }, [activeStateCode, hasInitialFilterParams, selectedYear]);

  useEffect(() => {
    if (!activeStateCode || questionMode !== "vendor_payments") return undefined;

    const controller = new AbortController();

    async function loadVendorYears() {
      setLoadingVendorYears(true);
      setVendorErrorMessage("");

      try {
        const payload = await fetchVendorPaymentYears(controller.signal);
        const years = payload.years;

        if (!years.length) {
          throw new Error("No Maryland vendor-payment years were returned.");
        }

        setVendorPaymentYears(years);
        const requestedYear = years.find(
          (year) =>
            String(year.fiscalYear) === String(initialVendorYearRequest) ||
            String(year.fiscalYear) === String(selectedYear)
        );
        setSelectedVendorYear(String((requestedYear || years[0]).fiscalYear));
      } catch (error) {
        if (error.name !== "AbortError") {
          setVendorErrorMessage(error.message);
        }
      } finally {
        setLoadingVendorYears(false);
      }
    }

    loadVendorYears();

    return () => controller.abort();
  }, [activeStateCode, initialVendorYearRequest, questionMode, selectedYear]);

  useEffect(() => {
    if (
      !activeStateCode ||
      questionMode !== "vendor_payments" ||
      !selectedVendorYear
    ) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadVendorPayments() {
      setVendorPaymentDetail(null);
      setLoadingVendorPayments(true);
      setVendorErrorMessage("");
      setTraceMessage("");
      setTraceRow(null);

      try {
        const detail = await fetchVendorPaymentDetail(
          {
            fiscalYear: Number(selectedVendorYear),
            searchQuery: vendorSearchQuery,
            agencyFilter: vendorAgencyFilter,
            categoryFilter: vendorCategoryFilter,
          },
          controller.signal
        );

        if (!detail) {
          throw new Error(
            `No vendor-payment detail was returned for FY ${selectedVendorYear}.`
          );
        }

        setVendorPaymentDetail(detail);
      } catch (error) {
        if (error.name !== "AbortError") {
          setVendorErrorMessage(error.message);
        }
      } finally {
        setLoadingVendorPayments(false);
      }
    }

    loadVendorPayments();

    return () => controller.abort();
  }, [
    activeStateCode,
    questionMode,
    selectedVendorYear,
    vendorAgencyFilter,
    vendorCategoryFilter,
    vendorSearchQuery,
  ]);

  useEffect(() => {
    if (!activeStateCode || typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("state", activeStateCode);
    if (selectedYear) params.set("year", selectedYear);
    params.set("mode", analysisMode);
    params.set("question", questionMode);
    if (analysisMode === "coverage" || questionMode === "vendor_payments") {
      params.set("source", coverageSourceId);
    }
    if (questionMode === "vendor_payments") {
      if (selectedVendorYear) params.set("paymentYear", selectedVendorYear);
      if (vendorSearchQuery.trim()) {
        params.set("vendorSearch", vendorSearchQuery.trim());
      }
      if (vendorAgencyFilter !== "all") {
        params.set("vendorAgency", vendorAgencyFilter);
      }
      if (vendorCategoryFilter !== "all") {
        params.set("vendorCategory", vendorCategoryFilter);
      }
    }
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (agencyFilter !== "all") params.set("agency", agencyFilter);
    if (fundFilter !== "all") params.set("fund", fundFilter);
    if (budgetStageFilter !== "all") params.set("stage", budgetStageFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (sortMode !== "amount") params.set("sort", sortMode);
    if (rowLimit !== "100") params.set("rows", rowLimit);

    const query = params.toString();
    const nextUrl = `${window.location.pathname}?${query}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [
    activeStateCode,
    agencyFilter,
    analysisMode,
    budgetStageFilter,
    categoryFilter,
    coverageSourceId,
    fundFilter,
    questionMode,
    rowLimit,
    searchQuery,
    selectedYear,
    sortMode,
    selectedVendorYear,
    vendorAgencyFilter,
    vendorCategoryFilter,
    vendorSearchQuery,
  ]);

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
  const displayMetadata =
    questionMode === "vendor_payments"
      ? vendorPaymentDetail?.metadata || DEFAULT_VENDOR_PAYMENT_METADATA
      : metadata;
  const displaySourceLastUpdated =
    questionMode === "vendor_payments"
      ? displayMetadata.dataLastUpdated || VENDOR_PAYMENTS_LAST_UPDATED
      : SOURCE_LAST_MODIFIED;
  const displayMetadataUpdated =
    questionMode === "vendor_payments"
      ? displayMetadata.metadataUpdated || VENDOR_PAYMENTS_METADATA_UPDATED
      : SOURCE_METADATA_UPDATED;
  const activeQuestion =
    QUESTION_OPTIONS.find((option) => option.value === questionMode) ||
    QUESTION_OPTIONS[0];
  const hidesAllocationTable =
    questionMode === "vendor_payments" || questionMode === "education_outcomes";
  const showsAllocationViews =
    ["overview", "drilldown"].includes(analysisMode) && !hidesAllocationTable;
  const hasActiveFilters =
    searchQuery.trim() ||
    agencyFilter !== "all" ||
    fundFilter !== "all" ||
    budgetStageFilter !== "all" ||
    categoryFilter !== "all" ||
    questionMode !== "latest" ||
    sortMode !== "amount" ||
    rowLimit !== "100" ||
    vendorSearchQuery.trim() ||
    vendorAgencyFilter !== "all" ||
    vendorCategoryFilter !== "all";

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

  function exportVendorPaymentCsv() {
    const payments = vendorPaymentDetail?.payments || [];

    if (!payments.length) return;

    const headers = [
      "Fiscal Year",
      "Agency",
      "Vendor",
      "Category/Code",
      "Vendor ZIP",
      "Amount",
      "% Vendor Payment Total",
      "Payment Rows",
      "Source",
      "Confidence",
      "Notes",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...payments.map((payment) =>
        [
          payment.fiscalYear,
          payment.agencyName,
          payment.vendorName,
          payment.category,
          payment.vendorZip,
          payment.dollarAmount,
          payment.percentage.toFixed(4),
          payment.paymentCount,
          payment.sourceLabel,
          payment.confidence,
          payment.notes,
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
    link.download = `maryland-vendor-payments-fy-${selectedVendorYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTraceMessage(`Exported ${payments.length} grouped vendor-payment rows as CSV.`);
  }

  async function copyViewLink() {
    if (typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      setTraceMessage("View link copied.");
    } catch {
      setTraceMessage(window.location.href);
    }
  }

  async function copySourceCitation() {
    const citation = `${displayMetadata.sourceLabel}. Maryland Open Data. ${displayMetadata.sourceUrl}. Data last modified ${displaySourceLastUpdated}; metadata updated ${displayMetadataUpdated}.`;

    try {
      await navigator.clipboard.writeText(citation);
      setTraceMessage("Source citation copied.");
    } catch {
      setTraceMessage(citation);
    }
  }

  async function copyTrace(row) {
    const trace = buildTraceText(row, budgetDetail);

    try {
      await navigator.clipboard.writeText(trace);
      setTraceMessage("Trace copied.");
    } catch {
      setTraceMessage(trace);
    }
  }

  function handleVendorTrace(payment) {
    setTraceRow(buildVendorTraceRow(payment, vendorPaymentDetail));
    setTraceMessage(`Trace opened for ${payment.vendorName}.`);
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
          <a
            href={displayMetadata.sourceUrl || SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {displayMetadata.sourceLabel || SOURCE_LABEL}
          </a>
          <span>Confidence</span>
          <ConfidenceBadge confidence={displayMetadata.confidence} />
          <small>Data last modified {displaySourceLastUpdated}</small>
          <small>Metadata updated {displayMetadataUpdated}</small>
          {questionMode === "vendor_payments" && selectedVendorYear && (
            <>
              <span>Payment fiscal year</span>
              <StageBadge stage={`FY ${selectedVendorYear}`} />
            </>
          )}
          {questionMode !== "vendor_payments" && budgetDetail?.budgetStage && (
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
          <button
            type="button"
            className="secondary-button"
            onClick={copyViewLink}
          >
            Copy view link
          </button>
          <button type="button" className="secondary-button" onClick={changeState}>
            Change state
          </button>
        </aside>
      </header>

      <ModeTabs activeMode={analysisMode} onChange={handleAnalysisModeChange} />

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

      {(loadingYears || loadingDetail || loadingVendorYears) && (
        <section className="loading-panel" aria-live="polite">
          <div className="spinner" />
          <p>
            {loadingYears
              ? "Loading fiscal years..."
              : loadingVendorYears
                ? "Loading vendor-payment fiscal years..."
                : `Loading FY ${selectedYear} allocations...`}
          </p>
        </section>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {budgetDetail && !loadingDetail && (
        <>
          <DataCoveragePanels
            metadata={displayMetadata}
            budgetStage={
              questionMode === "vendor_payments"
                ? "Vendor payments"
                : budgetDetail.budgetStage
            }
          />

          <section
            className="metrics-grid"
            aria-label={
              questionMode === "vendor_payments"
                ? "Budget and vendor payment summary"
                : "Budget summary"
            }
          >
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? `FY ${budgetDetail.fiscalYear} operating-budget total`
                  : `FY ${budgetDetail.fiscalYear} positive budget total`
              }
              value={formatMoney(budgetDetail.totalAmount)}
              detail={formatFullMoney(budgetDetail.totalAmount)}
            />
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? "Operating-budget line items"
                  : "Source line items"
              }
              value={formatNumber(budgetDetail.rowCount)}
              detail="Rows with budget values above zero"
            />
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? "Grouped budget allocations returned"
                  : "Grouped allocations returned"
              }
              value={formatNumber(budgetDetail.allocations.length)}
              detail={`Top grouped rows by amount, capped at ${formatNumber(
                budgetDetail.allocationLimit
              )}`}
            />
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? "Operating-budget stage"
                  : "Budget stage"
              }
              value={budgetDetail.budgetStage}
              detail="Normalized from the source type field"
            />
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? `FY ${selectedVendorYear || "selected"} vendor-payment total`
                  : "Current filter total"
              }
              value={
                questionMode === "vendor_payments"
                  ? formatMoney(vendorPaymentDetail?.totalAmount || 0)
                  : formatMoney(filteredTotal)
              }
              detail={
                questionMode === "vendor_payments"
                  ? vendorPaymentDetail
                    ? `${formatNumber(
                        vendorPaymentDetail.rowCount
                      )} payment rows in official source`
                    : "Vendor payments load from the separate source below"
                  : `${formatNumber(filteredRows.length)} matching allocations`
              }
            />
          </section>

          {traceMessage && (
            <section className="trace-panel" aria-live="polite">
              {traceMessage}
            </section>
          )}

          {(analysisMode === "overview" || analysisMode === "drilldown") && (
            <ExplainerPanel />
          )}

          {analysisMode === "trends" && (
            <YearTrendPanel budgetYears={budgetYears} selectedYear={selectedYear} />
          )}

          {analysisMode === "compare" && (
            <ComparisonPanel
              budgetDetail={budgetDetail}
              budgetYears={budgetYears}
              filteredRows={filteredRows}
              selectedYear={selectedYear}
            />
          )}

          {(analysisMode === "payments" || questionMode === "vendor_payments") && (
            <VendorPaymentsPanel
              vendorPaymentYears={vendorPaymentYears}
              selectedVendorYear={selectedVendorYear}
              onSelectedVendorYearChange={setSelectedVendorYear}
              vendorSearchQuery={vendorSearchQuery}
              onVendorSearchQueryChange={setVendorSearchQuery}
              vendorAgencyFilter={vendorAgencyFilter}
              onVendorAgencyFilterChange={setVendorAgencyFilter}
              vendorCategoryFilter={vendorCategoryFilter}
              onVendorCategoryFilterChange={setVendorCategoryFilter}
              vendorPaymentDetail={vendorPaymentDetail}
              loading={loadingVendorPayments}
              errorMessage={vendorErrorMessage}
              onTracePayment={handleVendorTrace}
              onExportPayments={exportVendorPaymentCsv}
              onCopyCitation={copySourceCitation}
              onCopyViewLink={copyViewLink}
            />
          )}

          {(analysisMode === "accountability" ||
            questionMode === "education_outcomes") && (
            <AccountabilityPanel budgetDetail={budgetDetail} />
          )}

          {analysisMode === "coverage" && (
            <BudgetCoveragePanel
              selectedSourceId={coverageSourceId}
              onSelectSourceId={setCoverageSourceId}
            />
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
              <button
                type="button"
                className="secondary-button"
                onClick={copyViewLink}
              >
                Copy view link
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

          {questionMode !== "vendor_payments" && (
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
          )}

          <TraceDrawer
            row={traceRow}
            budgetDetail={budgetDetail}
            filters={{
              searchQuery,
              agencyFilter,
              fundFilter,
              budgetStageFilter,
              categoryFilter,
            }}
            onClose={() => setTraceRow(null)}
            onCopy={copyTrace}
          />
        </>
      )}
    </main>
  );
}
