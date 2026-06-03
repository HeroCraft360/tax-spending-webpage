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
  DEFAULT_GRANTS_LOANS_METADATA,
  fetchGrantLoanDetail,
  fetchGrantLoanYears,
  GRANTS_LOANS_LAST_UPDATED,
  GRANTS_LOANS_METADATA_UPDATED,
} from "./data/marylandGrantsLoans";
import {
  CAPITAL_PROJECTS_LAST_UPDATED,
  CAPITAL_PROJECTS_METADATA_UPDATED,
  DEFAULT_CAPITAL_PROJECT_METADATA,
  fetchCapitalProjectDetail,
  fetchCapitalProjectYears,
} from "./data/marylandCapitalProjects";
import {
  DEFAULT_FUNDING_SOURCE_METADATA,
  fetchFundingSourceDetail,
  fetchFundingSourceYears,
  FUNDING_SOURCE_LAST_UPDATED,
  FUNDING_SOURCE_METADATA_UPDATED,
} from "./data/marylandFundingSources";
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
    label: "Compare Sources",
  },
  {
    value: "funding",
    label: "Funding Sources",
  },
  {
    value: "reconcile",
    label: "Reconcile Agencies",
  },
  {
    value: "payments",
    label: "Vendor Payments",
  },
  {
    value: "grants",
    label: "Grants & Loans",
  },
  {
    value: "capital",
    label: "Capital Projects",
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
    value: "funding_sources",
    label: "Funding sources",
    description:
      "Shows official operating-budget fund source rows by fund type, fund source, agency, and program.",
  },
  {
    value: "grants_loans",
    label: "Grants and loans",
    description:
      "Shows official Maryland grant and loan recipient records from the State Aid dataset.",
  },
  {
    value: "capital_projects",
    label: "Capital projects",
    description:
      "Shows official capital-budget projects and programs from the enacted capital document.",
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
  if (requestedQuestion === "funding_sources") return "funding";
  if (requestedQuestion === "grants_loans") return "grants";
  if (requestedQuestion === "capital_projects") return "capital";
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

  if (questionMode === "funding_sources") {
    return false;
  }

  if (questionMode === "grants_loans") {
    return false;
  }

  if (questionMode === "capital_projects") {
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

  if (questionMode === "funding_sources") {
    return "Funding sources use the official Maryland operating-budget funding-source dataset. These rows explain the fund/source mix behind budget amounts, but this source does not include the operating-budget stage/type field.";
  }

  if (questionMode === "grants_loans") {
    return "Grants and loans use the official Maryland State Aid dataset. These are recipient assistance records of $50,000 or more, not operating-budget allocations or vendor-payment transactions.";
  }

  if (questionMode === "capital_projects") {
    return "Capital projects use the official Maryland FY 2027 enacted capital-budget document. These are project and program authorizations, not operating allocations or vendor payments.";
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

function normalizeAgencyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getAgencyCanonicalKey(value) {
  const normalized = normalizeAgencyName(value);

  if (!normalized) return "";

  if (
    /\bmdot\b/.test(normalized) ||
    normalized.includes("transportation") ||
    normalized.includes("transit administration") ||
    normalized.includes("state highway admin") ||
    normalized.includes("motor vehicle administration") ||
    normalized.includes("aviation administration")
  ) {
    return "department transportation";
  }

  if (
    normalized.includes("maryland department of health") ||
    normalized.includes("department of health") ||
    normalized.includes("medical care programs")
  ) {
    return "department health";
  }

  if (
    normalized.includes("state department of education") ||
    normalized.includes("department of education") ||
    normalized.includes("aid to education")
  ) {
    return "state department education";
  }

  if (
    normalized.includes("department of human services") ||
    normalized.includes("local department operations")
  ) {
    return "department human services";
  }

  if (
    normalized.includes("department of the environment") ||
    normalized.includes("department environment")
  ) {
    return "department environment";
  }

  if (normalized.includes("interagency commission on school construction")) {
    return "interagency commission school construction";
  }

  if (
    normalized.includes("public debt") ||
    normalized.includes("redemption and interest on state bonds")
  ) {
    return "public debt";
  }

  return normalized
    .replace(/^state of maryland\s+/, "")
    .replace(/^maryland\s+/, "")
    .replace(/\bdept\b/g, "department")
    .replace(/\badmin\b/g, "administration")
    .replace(/\s+/g, " ")
    .trim();
}

function getAgencySourceTotals(rows, totalAmount) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = getAgencyCanonicalKey(row.name);
    if (!key) return;

    const current = grouped.get(key) || {
      key,
      name: row.name,
      dollarAmount: 0,
      sourceNames: [],
    };

    current.dollarAmount += row.dollarAmount;
    const sourceNames = row.sourceNames?.length ? row.sourceNames : [row.name];
    sourceNames.forEach((sourceName) => {
      if (!current.sourceNames.includes(sourceName)) {
        current.sourceNames.push(sourceName);
      }
    });
    if (row.dollarAmount > (current.primaryAmount || 0)) {
      current.name = row.name;
      current.primaryAmount = row.dollarAmount;
    }

    grouped.set(key, current);
  });

  return [...grouped.values()].map((row) => ({
    ...row,
    percentage: totalAmount > 0 ? (row.dollarAmount / totalAmount) * 100 : 0,
  }));
}

function getAgencyMatchSummary({ operating, vendor, grants, capital }) {
  const sourceCount = [operating, vendor, grants, capital].filter(Boolean).length;

  if (sourceCount >= 4) {
    return {
      confidence: "High",
      status: "Four-source match",
      reason:
        "Matched across operating budget, vendor payments, grants and loans, and capital projects.",
    };
  }

  if (sourceCount === 3) {
    return {
      confidence: "High",
      status: "Triangulated",
      reason:
        "Matched across three connected sources; use detailed source tracing to confirm the definition of each amount.",
    };
  }

  if (sourceCount === 2) {
    return {
      confidence: "Medium",
      status: "Partial match",
      reason: "Matched across two connected sources; the missing source may use another label or may not have matching records in the loaded summary.",
    };
  }

  return {
    confidence: "Review",
    status: "Single source",
    reason: "Visible in one connected source only; use source tracing before treating it as a reconciliation match.",
  };
}

function getPreferredAgencyName({ operating, vendor, grants, capital }) {
  return (
    operating?.name ||
    capital?.name ||
    grants?.name ||
    vendor?.name ||
    "Unknown agency"
  );
}

function getAgencyReconciliationRows({
  operatingRows = [],
  vendorRows = [],
  grantRows = [],
  capitalRows = [],
  operatingTotal = 0,
  vendorTotal = 0,
  grantTotal = 0,
  capitalTotal = 0,
}) {
  const operatingTotals = getAgencySourceTotals(operatingRows, operatingTotal);
  const vendorTotals = getAgencySourceTotals(vendorRows, vendorTotal);
  const grantTotals = getAgencySourceTotals(grantRows, grantTotal);
  const capitalTotals = getAgencySourceTotals(capitalRows, capitalTotal);
  const keys = new Set([
    ...operatingTotals.map((row) => row.key),
    ...vendorTotals.map((row) => row.key),
    ...grantTotals.map((row) => row.key),
    ...capitalTotals.map((row) => row.key),
  ]);

  return [...keys]
    .map((key) => {
      const operating = operatingTotals.find((row) => row.key === key);
      const vendor = vendorTotals.find((row) => row.key === key);
      const grants = grantTotals.find((row) => row.key === key);
      const capital = capitalTotals.find((row) => row.key === key);
      const match = getAgencyMatchSummary({ operating, vendor, grants, capital });
      const maxAmount = Math.max(
        operating?.dollarAmount || 0,
        vendor?.dollarAmount || 0,
        grants?.dollarAmount || 0,
        capital?.dollarAmount || 0
      );

      return {
        key,
        name: getPreferredAgencyName({ operating, vendor, grants, capital }),
        operating,
        vendor,
        grants,
        capital,
        matchConfidence: match.confidence,
        matchStatus: match.status,
        matchReason: match.reason,
        sourceCount: [operating, vendor, grants, capital].filter(Boolean).length,
        maxAmount,
        paymentScale:
          operating?.dollarAmount > 0 && vendor?.dollarAmount
            ? (vendor.dollarAmount / operating.dollarAmount) * 100
            : null,
        grantScale:
          operating?.dollarAmount > 0 && grants?.dollarAmount
            ? (grants.dollarAmount / operating.dollarAmount) * 100
            : null,
        capitalScale:
          operating?.dollarAmount > 0 && capital?.dollarAmount
            ? (capital.dollarAmount / operating.dollarAmount) * 100
            : null,
      };
    })
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
      return b.maxAmount - a.maxAmount;
    });
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
  const liveSources = BUDGET_COVERAGE_SOURCES.filter(
    (source) => source.status === "Live"
  );
  const liveTotalScore = liveSources.reduce(
    (sum, source) => sum + (source.coverageScore || 0),
    0
  );
  const averageScore = Math.round(totalScore / BUDGET_COVERAGE_SOURCES.length);
  const liveScore = liveSources.length
    ? Math.round(liveTotalScore / liveSources.length)
    : 0;

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

function buildFundingSourceTraceRow(row, fundingSourceDetail) {
  return {
    fiscalYear: row.fiscalYear,
    agencyName: row.agencyName,
    unitName: `${row.fundSourceName} (${row.fundSourceCode})`,
    programName: row.programName,
    subprogramName: row.description,
    categoryTitle: row.categoryTitle,
    fundType: row.fundType,
    budgetStage: "Funding source row",
    sourceLabel: row.sourceLabel,
    sourceUrl: row.sourceUrl,
    confidence: row.confidence,
    notes: row.notes,
    dollarAmount: row.dollarAmount,
    percentage: row.percentage,
    traceType: "Funding source",
    traceTotalAmount: fundingSourceDetail?.totalAmount || 0,
    traceTotalLabel: `FY ${row.fiscalYear} funding-source total`,
  };
}

function buildCapitalTraceRow(project, capitalProjectDetail) {
  return {
    fiscalYear: project.fiscalYear,
    agencyName: project.agencyName,
    unitName: project.county,
    programName: project.projectTitle,
    subprogramName: project.projectType,
    categoryTitle: project.category,
    fundType: project.fundType,
    budgetStage: project.budgetStage,
    sourceLabel: project.sourceLabel,
    sourceUrl: project.sourceUrl,
    confidence: project.confidence,
    notes: `${project.notes.replace(/\.$/, "")}; source PDF page ${project.sourcePage}`,
    dollarAmount: project.dollarAmount,
    percentage: project.percentage,
    traceType: "Capital project",
    traceTotalAmount: capitalProjectDetail?.totalAmount || 0,
    traceTotalLabel: `FY ${project.fiscalYear} enacted capital-budget total`,
  };
}

function buildGrantLoanTraceRow(award, grantLoanDetail) {
  return {
    fiscalYear: award.fiscalYear,
    agencyName: award.agencyName,
    unitName: award.grantor,
    programName: award.granteeName,
    subprogramName: award.description,
    categoryTitle: award.category,
    fundType: award.recipientZip,
    budgetStage: "Grant/loan recipient record",
    sourceLabel: award.sourceLabel,
    sourceUrl: award.sourceUrl,
    confidence: award.confidence,
    notes: award.notes,
    dollarAmount: award.dollarAmount,
    percentage: award.percentage,
    traceType: "Grant/loan award",
    traceTotalAmount: grantLoanDetail?.totalAmount || 0,
    traceTotalLabel: `FY ${award.fiscalYear} grants-and-loans total`,
  };
}

function getActiveFilterSummary(filters) {
  if (filters.traceContext === "funding") {
    return [
      { label: "Search", value: filters.searchQuery || "None" },
      {
        label: "Funding agency",
        value: filters.agencyFilter === "all" ? "All" : filters.agencyFilter,
      },
      {
        label: "Fund type",
        value: filters.fundFilter === "all" ? "All" : filters.fundFilter,
      },
      {
        label: "Fund source",
        value:
          filters.fundingSourceFilter === "all"
            ? "All"
            : filters.fundingSourceFilter,
      },
      {
        label: "Category",
        value: filters.categoryFilter === "all" ? "All" : filters.categoryFilter,
      },
    ];
  }

  if (filters.traceContext === "grants") {
    return [
      { label: "Search", value: filters.searchQuery || "None" },
      {
        label: "Grantor",
        value: filters.agencyFilter === "all" ? "All" : filters.agencyFilter,
      },
      {
        label: "Category",
        value: filters.categoryFilter === "all" ? "All" : filters.categoryFilter,
      },
      {
        label: "Recipient ZIP",
        value: filters.grantLoanZipFilter === "all" ? "All" : filters.grantLoanZipFilter,
      },
    ];
  }

  if (filters.traceContext === "vendor") {
    return [
      { label: "Search", value: filters.searchQuery || "None" },
      {
        label: "Payment agency",
        value: filters.agencyFilter === "all" ? "All" : filters.agencyFilter,
      },
      {
        label: "Category/code",
        value: filters.categoryFilter === "all" ? "All" : filters.categoryFilter,
      },
    ];
  }

  if (filters.traceContext === "capital") {
    return [
      { label: "Search", value: filters.searchQuery || "None" },
      {
        label: "Capital agency",
        value: filters.agencyFilter === "all" ? "All" : filters.agencyFilter,
      },
      {
        label: "Fund type",
        value: filters.fundFilter === "all" ? "All" : filters.fundFilter,
      },
      {
        label: "Category",
        value: filters.categoryFilter === "all" ? "All" : filters.categoryFilter,
      },
      {
        label: "Capital county",
        value:
          filters.capitalCountyFilter === "all"
            ? "All"
            : filters.capitalCountyFilter,
      },
      {
        label: "Capital type",
        value:
          filters.capitalProjectTypeFilter === "all"
            ? "All"
            : filters.capitalProjectTypeFilter,
      },
    ];
  }

  const summary = [
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

  return summary;
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

function QuestionNotice({ questionMode, selectedYearLabel, analysisMode }) {
  const notice =
    analysisMode === "compare"
      ? "Compare Sources keeps operating-budget allocations, funding sources, vendor payments, grants/loans, and capital authorizations separate so scale checks do not imply a single reconciled total."
      : analysisMode === "reconcile"
        ? "Reconcile Agencies matches published agency labels across sources and flags confidence. Treat the results as review guidance, not audited accounting matches."
      : getQuestionNotice(questionMode, selectedYearLabel);

  return (
    <section
      className={
        analysisMode === "compare" ||
        analysisMode === "reconcile" ||
        questionMode === "vendor_payments" ||
        questionMode === "grants_loans" ||
        questionMode === "education_outcomes"
          ? "question-notice warning"
          : "question-notice"
      }
      aria-live="polite"
    >
      {notice}
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

function ComparisonPanel({
  budgetDetail,
  budgetYears,
  filteredRows,
  selectedYear,
  fundingSourceYears,
  selectedFundingYear,
  onSelectedFundingYearChange,
  fundingSourceDetail,
  loadingFundingYears,
  loadingFundingSources,
  fundingErrorMessage,
  vendorPaymentYears,
  selectedVendorYear,
  onSelectedVendorYearChange,
  vendorPaymentDetail,
  loadingVendorYears,
  loadingVendorPayments,
  vendorErrorMessage,
  grantLoanYears,
  selectedGrantLoanYear,
  onSelectedGrantLoanYearChange,
  grantLoanDetail,
  loadingGrantLoanYears,
  loadingGrantLoans,
  grantLoanErrorMessage,
  capitalProjectYears,
  selectedCapitalYear,
  onSelectedCapitalYearChange,
  capitalProjectDetail,
  loadingCapitalYears,
  loadingCapitalProjects,
  capitalErrorMessage,
}) {
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
  const vendorMetadata =
    vendorPaymentDetail?.metadata || DEFAULT_VENDOR_PAYMENT_METADATA;
  const fundingMetadata =
    fundingSourceDetail?.metadata || DEFAULT_FUNDING_SOURCE_METADATA;
  const grantLoanMetadata =
    grantLoanDetail?.metadata || DEFAULT_GRANTS_LOANS_METADATA;
  const capitalMetadata =
    capitalProjectDetail?.metadata || DEFAULT_CAPITAL_PROJECT_METADATA;
  const loadingVendorComparison = loadingVendorYears || loadingVendorPayments;
  const loadingFundingComparison = loadingFundingYears || loadingFundingSources;
  const loadingGrantLoanComparison = loadingGrantLoanYears || loadingGrantLoans;
  const loadingCapitalComparison = loadingCapitalYears || loadingCapitalProjects;
  const vendorScale =
    budgetDetail.totalAmount > 0 && vendorPaymentDetail?.totalAmount
      ? (vendorPaymentDetail.totalAmount / budgetDetail.totalAmount) * 100
      : 0;
  const fundingScale =
    budgetDetail.totalAmount > 0 && fundingSourceDetail?.totalAmount
      ? (fundingSourceDetail.totalAmount / budgetDetail.totalAmount) * 100
      : 0;
  const grantLoanScale =
    budgetDetail.totalAmount > 0 && grantLoanDetail?.totalAmount
      ? (grantLoanDetail.totalAmount / budgetDetail.totalAmount) * 100
      : 0;
  const capitalScale =
    budgetDetail.totalAmount > 0 && capitalProjectDetail?.totalAmount
      ? (capitalProjectDetail.totalAmount / budgetDetail.totalAmount) * 100
      : 0;
  const operatingAgencyRows = getGroupedTotals(
    filteredRows,
    "agencyName",
    filteredTotal || budgetDetail.totalAmount,
    100
  );
  const vendorAgencyRows = vendorPaymentDetail?.topAgencies || [];
  const grantAgencyRows = grantLoanDetail?.topAgencies || [];
  const capitalAgencyRows = capitalProjectDetail?.topAgencies || [];
  const agencyComparisonRows = getAgencyReconciliationRows({
    operatingRows: operatingAgencyRows.slice(0, 8),
    vendorRows: vendorAgencyRows.slice(0, 8),
    grantRows: grantAgencyRows.slice(0, 8),
    capitalRows: capitalAgencyRows.slice(0, 8),
    operatingTotal: filteredTotal || budgetDetail.totalAmount,
    vendorTotal: vendorPaymentDetail?.totalAmount || 0,
    grantTotal: grantLoanDetail?.totalAmount || 0,
    capitalTotal: capitalProjectDetail?.totalAmount || 0,
  }).slice(0, 10);
  const topOperatingRow = [...filteredRows].sort(
    (a, b) => b.dollarAmount - a.dollarAmount
  )[0];
  const topVendor = vendorPaymentDetail?.topVendors?.[0];
  const topFundSource = fundingSourceDetail?.fundSources?.[0];
  const topGrantRecipient = grantLoanDetail?.topRecipients?.[0];
  const topCapitalProject = capitalProjectDetail?.projects?.[0];
  const sourceCards = [
    {
      id: "operating",
      label: "Operating budget",
      yearLabel: `FY ${budgetDetail.fiscalYear}`,
      amount: budgetDetail.totalAmount,
      status: "Live",
      sourceLabel: budgetDetail.metadata?.sourceLabel || SOURCE_LABEL,
      sourceUrl: budgetDetail.metadata?.sourceUrl || SOURCE_URL,
      rowDetail: `${formatNumber(budgetDetail.rowCount)} source line items`,
      primarySignal: topOperatingRow
        ? `${topOperatingRow.programName}: ${formatMoney(
            topOperatingRow.dollarAmount
          )}`
        : "No operating rows in the current view",
      explains:
        "Planned appropriations for programs, agencies, budget stages, fund types, and recurring services.",
      guardrail:
        "It does not show every vendor paid or every long-term construction/project authorization.",
    },
    {
      id: "funding",
      label: "Funding sources",
      yearLabel: selectedFundingYear ? `FY ${selectedFundingYear}` : "Loading",
      amount: fundingSourceDetail?.totalAmount || 0,
      status: fundingErrorMessage
        ? "Error"
        : loadingFundingComparison
          ? "Loading"
          : fundingSourceDetail
            ? "Live"
            : "Waiting",
      sourceLabel: fundingMetadata.sourceLabel,
      sourceUrl: fundingMetadata.sourceUrl,
      rowDetail: fundingSourceDetail
        ? `${formatNumber(fundingSourceDetail.rowCount)} funding-source rows`
        : "Separate official funding-source source",
      primarySignal: topFundSource
        ? `${topFundSource.name}: ${formatMoney(topFundSource.dollarAmount)}`
        : "Top fund source loads with the funding source",
      explains:
        "Fund type and fund source mix behind operating-budget amounts by agency, program, category, and source code.",
      guardrail:
        "It does not include the operating-budget stage/type field and is not a vendor-payment or capital-project ledger.",
      errorMessage: fundingErrorMessage,
      loading: loadingFundingComparison,
    },
    {
      id: "payments",
      label: "Vendor payments",
      yearLabel: selectedVendorYear ? `FY ${selectedVendorYear}` : "Loading",
      amount: vendorPaymentDetail?.totalAmount || 0,
      status: vendorErrorMessage
        ? "Error"
        : loadingVendorComparison
          ? "Loading"
          : vendorPaymentDetail
            ? "Live"
            : "Waiting",
      sourceLabel: vendorMetadata.sourceLabel,
      sourceUrl: vendorMetadata.sourceUrl,
      rowDetail: vendorPaymentDetail
        ? `${formatNumber(vendorPaymentDetail.rowCount)} payment rows`
        : "Separate official payment source",
      primarySignal: topVendor
        ? `${topVendor.name}: ${formatMoney(topVendor.dollarAmount)}`
        : "Top vendor loads with the payment source",
      explains:
        "Actual payment activity by fiscal year, agency, vendor, category/code, ZIP, and amount.",
      guardrail:
        "It is not the budget plan, and current-year records can be partial or excluded by portal rules.",
      errorMessage: vendorErrorMessage,
      loading: loadingVendorComparison,
    },
    {
      id: "grants",
      label: "Grants and loans",
      yearLabel: selectedGrantLoanYear ? `FY ${selectedGrantLoanYear}` : "Loading",
      amount: grantLoanDetail?.totalAmount || 0,
      status: grantLoanErrorMessage
        ? "Error"
        : loadingGrantLoanComparison
          ? "Loading"
          : grantLoanDetail
            ? "Live"
            : "Waiting",
      sourceLabel: grantLoanMetadata.sourceLabel,
      sourceUrl: grantLoanMetadata.sourceUrl,
      rowDetail: grantLoanDetail
        ? `${formatNumber(grantLoanDetail.rowCount)} award rows`
        : "Separate official State Aid source",
      primarySignal: topGrantRecipient
        ? `${topGrantRecipient.name}: ${formatMoney(
            topGrantRecipient.dollarAmount
          )}`
        : "Top recipient loads with the grants-and-loans source",
      explains:
        "Recipient-level State Aid grants and loans by grantor, recipient, category, ZIP, date, and amount.",
      guardrail:
        "It includes awards of $50,000 or more to profit and nonprofit entities, not all aid, local-government payments, or operating-budget intent.",
      errorMessage: grantLoanErrorMessage,
      loading: loadingGrantLoanComparison,
    },
    {
      id: "capital",
      label: "Capital projects",
      yearLabel: selectedCapitalYear ? `FY ${selectedCapitalYear}` : "Loading",
      amount: capitalProjectDetail?.totalAmount || 0,
      status: capitalErrorMessage
        ? "Error"
        : loadingCapitalComparison
          ? "Loading"
          : capitalProjectDetail
            ? "Live"
            : "Waiting",
      sourceLabel: capitalMetadata.sourceLabel,
      sourceUrl: capitalMetadata.sourceUrl,
      rowDetail: capitalProjectDetail
        ? `${formatNumber(capitalProjectDetail.rowCount)} normalized rows`
        : "Separate enacted capital-budget source",
      primarySignal: topCapitalProject
        ? `${topCapitalProject.projectTitle}: ${formatMoney(
            topCapitalProject.dollarAmount
          )}`
        : "Top project loads with the capital source",
      explains:
        "Long-lived project and program authorizations by agency, county, category, fund type, and project type.",
      guardrail:
        "It is not recurring operating spend and is not proof that a vendor has been paid.",
      errorMessage: capitalErrorMessage,
      loading: loadingCapitalComparison,
    },
  ];

  return (
    <section className="panel comparison-panel">
      <div className="panel-heading">
        <div>
          <h2>Budget vs Funding vs Payments vs Grants vs Capital</h2>
          <p>
            Compare the main public spending sources without merging unlike
            numbers into one total. The operating budget is the plan, funding
            sources explain the fund mix, vendor payments show payment activity,
            grants and loans show State Aid assistance, and capital projects
            show long-term authorizations.
          </p>
        </div>
        <StageBadge stage={selectedYearSummary?.budgetStage || budgetDetail.budgetStage} />
      </div>

      <div className="comparison-controls" aria-label="Comparison controls">
        <div className="control-field">
          <label htmlFor="compare-funding-year">Funding-source fiscal year</label>
          <select
            id="compare-funding-year"
            value={selectedFundingYear}
            onChange={(event) => onSelectedFundingYearChange(event.target.value)}
            disabled={loadingFundingYears || !fundingSourceYears.length}
          >
            {fundingSourceYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="compare-payment-year">Payment fiscal year</label>
          <select
            id="compare-payment-year"
            value={selectedVendorYear}
            onChange={(event) => onSelectedVendorYearChange(event.target.value)}
            disabled={loadingVendorYears || !vendorPaymentYears.length}
          >
            {vendorPaymentYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="compare-grant-year">Grant/loan fiscal year</label>
          <select
            id="compare-grant-year"
            value={selectedGrantLoanYear}
            onChange={(event) => onSelectedGrantLoanYearChange(event.target.value)}
            disabled={loadingGrantLoanYears || !grantLoanYears.length}
          >
            {grantLoanYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="compare-capital-year">Capital fiscal year</label>
          <select
            id="compare-capital-year"
            value={selectedCapitalYear}
            onChange={(event) => onSelectedCapitalYearChange(event.target.value)}
            disabled={loadingCapitalYears || !capitalProjectYears.length}
          >
            {capitalProjectYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear} / {year.budgetStage}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="source-compare-grid">
        {sourceCards.map((card) => (
          <article className={`source-compare-card ${card.id}`} key={card.id}>
            <div className="source-compare-top">
              <div>
                <span>{card.yearLabel}</span>
                <h3>{card.label}</h3>
              </div>
              <CoverageStatusBadge status={card.status} />
            </div>
            <strong>
              {card.loading
                ? "Loading"
                : card.errorMessage
                  ? "Check source"
                  : formatMoney(card.amount)}
            </strong>
            <p>{card.rowDetail}</p>
            <a href={card.sourceUrl} target="_blank" rel="noreferrer">
              {card.sourceLabel}
            </a>
            <div className="source-compare-note">
              <span>Top signal</span>
              <p>{card.primarySignal}</p>
            </div>
            <div className="source-compare-note">
              <span>Best for</span>
              <p>{card.explains}</p>
            </div>
            <div className="source-compare-note">
              <span>Guardrail</span>
              <p>{card.errorMessage || card.guardrail}</p>
            </div>
          </article>
        ))}
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
          label="Funding-source scale check"
          value={fundingSourceDetail ? formatPercent(fundingScale) : "Loading"}
          detail={`Compared with FY ${budgetDetail.fiscalYear} operating total only`}
        />
        <MetricCard
          label="General Fund share"
          value={
            fundingSourceDetail ? formatPercent(fundingSourceDetail.generalFundShare) : "Loading"
          }
          detail={
            fundingSourceDetail
              ? `FY ${fundingSourceDetail.fiscalYear} funding-source rows`
              : "Loads with the funding-source source"
          }
        />
        <MetricCard
          label="Vendor payment scale check"
          value={vendorPaymentDetail ? formatPercent(vendorScale) : "Loading"}
          detail={`Compared with FY ${budgetDetail.fiscalYear} operating total only`}
        />
        <MetricCard
          label="Grant/loan scale check"
          value={grantLoanDetail ? formatPercent(grantLoanScale) : "Loading"}
          detail={`Compared with FY ${budgetDetail.fiscalYear} operating total only`}
        />
        <MetricCard
          label="Capital authorization scale check"
          value={capitalProjectDetail ? formatPercent(capitalScale) : "Loading"}
          detail={`Compared with FY ${budgetDetail.fiscalYear} operating total only`}
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

      <div className="comparison-rule-grid">
        <article>
          <h3>Same dollars?</h3>
          <p>
            No. Operating budgets, funding-source rows, vendor payments,
            grants/loans, and capital authorizations answer different
            questions. The scale checks are orientation, not audited
            reconciliations.
          </p>
        </article>
        <article>
          <h3>Same year?</h3>
          <p>
            Operating FY {budgetDetail.fiscalYear}, funding{" "}
            {selectedFundingYear ? `FY ${selectedFundingYear}` : "year loading"},
            payment{" "}
            {selectedVendorYear ? `FY ${selectedVendorYear}` : "year loading"},
            grant/loan{" "}
            {selectedGrantLoanYear ? `FY ${selectedGrantLoanYear}` : "year loading"},
            and capital{" "}
            {selectedCapitalYear ? `FY ${selectedCapitalYear}` : "year loading"}{" "}
            are kept visible because fiscal years do not always cover the same
            source status.
          </p>
        </article>
        <article>
          <h3>Same agency?</h3>
          <p>
            Agency names are compared as published. Rows that do not line up
            exactly are still useful signals, but they need source-level tracing
            before being treated as a match.
          </p>
        </article>
      </div>

      <section className="agency-comparison-panel">
        <div className="panel-heading compact-heading">
          <div>
            <h3>Agency Overlap Signals</h3>
            <p>
              Top agency labels from each connected source, shown side by side
              where the published names match.
            </p>
          </div>
        </div>

        {agencyComparisonRows.length ? (
          <div className="table-wrap compact-table-wrap">
            <table className="agency-comparison-table">
              <thead>
                <tr>
                  <th>Agency label</th>
                  <th>Operating allocations</th>
                  <th>Vendor payments</th>
                  <th>Grants/loans</th>
                  <th>Capital authorizations</th>
                </tr>
              </thead>
              <tbody>
                {agencyComparisonRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>
                      {row.operating
                        ? formatMoney(row.operating.dollarAmount)
                        : "Not in current view"}
                    </td>
                    <td>
                      {row.vendor
                        ? formatMoney(row.vendor.dollarAmount)
                        : vendorPaymentDetail
                          ? "Not in top source rows"
                          : "Loading"}
                    </td>
                    <td>
                      {row.grants
                        ? formatMoney(row.grants.dollarAmount)
                        : grantLoanDetail
                          ? "Not in top source rows"
                          : "Loading"}
                    </td>
                    <td>
                      {row.capital
                        ? formatMoney(row.capital.dollarAmount)
                        : capitalProjectDetail
                          ? "Not in top source rows"
                          : "Loading"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No agency comparison rows are available yet.</p>
        )}
      </section>

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

      <footer className="panel-footnote">
        This comparison intentionally keeps source definitions separate.
        Reconciliation can match agency labels where official records expose
        enough shared context, but it should not merge unlike totals.
      </footer>
    </section>
  );
}

function ReconciliationPanel({
  budgetDetail,
  filteredRows,
  vendorPaymentYears,
  selectedVendorYear,
  onSelectedVendorYearChange,
  vendorPaymentDetail,
  loadingVendorYears,
  loadingVendorPayments,
  vendorErrorMessage,
  grantLoanYears,
  selectedGrantLoanYear,
  onSelectedGrantLoanYearChange,
  grantLoanDetail,
  loadingGrantLoanYears,
  loadingGrantLoans,
  grantLoanErrorMessage,
  capitalProjectYears,
  selectedCapitalYear,
  onSelectedCapitalYearChange,
  capitalProjectDetail,
  loadingCapitalYears,
  loadingCapitalProjects,
  capitalErrorMessage,
  onOpenOperatingAgency,
  onOpenVendorAgency,
  onOpenGrantLoanAgency,
  onOpenCapitalAgency,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [selectedAgencyKey, setSelectedAgencyKey] = useState("");
  const filteredTotal = filteredRows.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );
  const operatingAgencyRows = getGroupedTotals(
    filteredRows,
    "agencyName",
    filteredTotal || budgetDetail.totalAmount,
    200
  );
  const capitalAgencyRows = getGroupedTotals(
    capitalProjectDetail?.projects || [],
    "agencyName",
    capitalProjectDetail?.totalAmount || 0,
    200
  );
  const reconciliationRows = useMemo(
    () =>
      getAgencyReconciliationRows({
        operatingRows: operatingAgencyRows,
        vendorRows: vendorPaymentDetail?.topAgencies || [],
        grantRows: grantLoanDetail?.topAgencies || [],
        capitalRows: capitalAgencyRows,
        operatingTotal: filteredTotal || budgetDetail.totalAmount,
        vendorTotal: vendorPaymentDetail?.totalAmount || 0,
        grantTotal: grantLoanDetail?.totalAmount || 0,
        capitalTotal: capitalProjectDetail?.totalAmount || 0,
      }),
    [
      budgetDetail.totalAmount,
      capitalAgencyRows,
      capitalProjectDetail?.totalAmount,
      filteredTotal,
      grantLoanDetail?.topAgencies,
      grantLoanDetail?.totalAmount,
      operatingAgencyRows,
      vendorPaymentDetail?.topAgencies,
      vendorPaymentDetail?.totalAmount,
    ]
  );
  const visibleRows = useMemo(() => {
    const query = normalizeAgencyName(searchQuery);

    return reconciliationRows.filter((row) => {
      const sourceNames = [
        ...(row.operating?.sourceNames || []),
        ...(row.vendor?.sourceNames || []),
        ...(row.grants?.sourceNames || []),
        ...(row.capital?.sourceNames || []),
      ];
      const matchesSearch =
        !query ||
        normalizeAgencyName(row.name).includes(query) ||
        sourceNames.some((name) => normalizeAgencyName(name).includes(query));
      const matchesFilter =
        matchFilter === "all" ||
        (matchFilter === "triangulated" && row.sourceCount >= 3) ||
        (matchFilter === "partial" && row.sourceCount === 2) ||
        (matchFilter === "review" && row.sourceCount === 1);

      return matchesSearch && matchesFilter;
    });
  }, [matchFilter, reconciliationRows, searchQuery]);

  const selectedAgency =
    visibleRows.find((row) => row.key === selectedAgencyKey) || visibleRows[0];
  const fourSourceCount = reconciliationRows.filter(
    (row) => row.sourceCount === 4
  ).length;
  const triangulatedCount = reconciliationRows.filter(
    (row) => row.sourceCount >= 3
  ).length;
  const partialCount = reconciliationRows.filter(
    (row) => row.sourceCount === 2
  ).length;
  const reviewCount = reconciliationRows.filter(
    (row) => row.sourceCount === 1
  ).length;
  const loadingSourceData =
    loadingVendorYears ||
    loadingVendorPayments ||
    loadingGrantLoanYears ||
    loadingGrantLoans ||
    loadingCapitalYears ||
    loadingCapitalProjects;

  function getSourceNames(row) {
    return [
      ...(row?.operating?.sourceNames || []),
      ...(row?.vendor?.sourceNames || []),
      ...(row?.grants?.sourceNames || []),
      ...(row?.capital?.sourceNames || []),
    ];
  }

  function getGapItems(row) {
    if (!row) return [];

    return [
      !row.operating
        ? "No operating-budget agency match is visible in the current allocation filters."
        : "",
      !row.vendor
        ? "No vendor-payment agency match appears in the loaded top-agency payment summary."
        : "",
      !row.grants
        ? "No grant/loan agency match appears in the loaded top-agency assistance summary."
        : "",
      !row.capital
        ? "No capital-project agency match appears in the normalized capital-project rows."
        : "",
      "Payment totals, grants/loans, and capital authorizations are scale signals, not amounts subtracted from operating allocations.",
      row.matchReason,
    ].filter(Boolean);
  }

  return (
    <section className="panel reconciliation-panel">
      <div className="panel-heading">
        <div>
          <h2>Agency Reconciliation</h2>
          <p>
            Match agency labels across the operating budget, vendor payments,
            grants/loans, and capital projects. Confidence describes source
            alignment, not an audited accounting reconciliation.
          </p>
        </div>
        <CoverageStatusBadge status="Live" />
      </div>

      <div className="comparison-controls reconciliation-controls">
        <div className="control-field">
          <label htmlFor="reconcile-payment-year">Payment fiscal year</label>
          <select
            id="reconcile-payment-year"
            value={selectedVendorYear}
            onChange={(event) => onSelectedVendorYearChange(event.target.value)}
            disabled={loadingVendorYears || !vendorPaymentYears.length}
          >
            {vendorPaymentYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="reconcile-grant-year">Grant/loan fiscal year</label>
          <select
            id="reconcile-grant-year"
            value={selectedGrantLoanYear}
            onChange={(event) => onSelectedGrantLoanYearChange(event.target.value)}
            disabled={loadingGrantLoanYears || !grantLoanYears.length}
          >
            {grantLoanYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field">
          <label htmlFor="reconcile-capital-year">Capital fiscal year</label>
          <select
            id="reconcile-capital-year"
            value={selectedCapitalYear}
            onChange={(event) => onSelectedCapitalYearChange(event.target.value)}
            disabled={loadingCapitalYears || !capitalProjectYears.length}
          >
            {capitalProjectYears.map((year) => (
              <option key={year.fiscalYear} value={year.fiscalYear}>
                FY {year.fiscalYear} / {year.budgetStage}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field control-field-wide">
          <label htmlFor="reconcile-search">Agency search</label>
          <input
            id="reconcile-search"
            type="search"
            placeholder="Agency name from any source"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="control-field">
          <label htmlFor="reconcile-match-filter">Match type</label>
          <select
            id="reconcile-match-filter"
            value={matchFilter}
            onChange={(event) => setMatchFilter(event.target.value)}
          >
            <option value="all">All matches</option>
            <option value="triangulated">Triangulated</option>
            <option value="partial">Partial</option>
            <option value="review">Single source</option>
          </select>
        </div>
      </div>

      {(vendorErrorMessage || grantLoanErrorMessage || capitalErrorMessage) && (
        <p className="error-message">
          {vendorErrorMessage || grantLoanErrorMessage || capitalErrorMessage}
        </p>
      )}

      <div className="comparison-grid">
        <MetricCard
          label="Agencies in matcher"
          value={formatNumber(reconciliationRows.length)}
          detail={`${formatNumber(visibleRows.length)} visible after filters`}
        />
        <MetricCard
          label="Three-plus source matches"
          value={formatNumber(triangulatedCount)}
          detail={`${formatNumber(fourSourceCount)} visible across all four connected sources`}
        />
        <MetricCard
          label="Partial matches"
          value={formatNumber(partialCount)}
          detail="Visible across two connected sources"
        />
        <MetricCard
          label="Review-only agencies"
          value={formatNumber(reviewCount)}
          detail="Visible in one source summary only"
        />
      </div>

      {loadingSourceData && (
        <section className="loading-panel reconciliation-loading" aria-live="polite">
          <div className="spinner" />
          <p>Loading reconciliation source summaries...</p>
        </section>
      )}

      <section className="reconciliation-layout">
        <div className="agency-comparison-panel reconciliation-table-panel">
          <div className="panel-heading compact-heading">
            <div>
              <h3>Agency Match Table</h3>
              <p>
                Select an agency to inspect source labels, unmatched areas, and
                links into each detailed explorer.
              </p>
            </div>
          </div>

          {visibleRows.length ? (
            <div className="table-wrap reconciliation-table-wrap">
              <table className="agency-comparison-table reconciliation-table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>Confidence</th>
                    <th>Operating</th>
                    <th>Payments</th>
                    <th>Grants/Loans</th>
                    <th>Capital</th>
                    <th>Payment scale</th>
                    <th>Grant/loan scale</th>
                    <th>Capital scale</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={row.key}
                      className={
                        row.key === selectedAgency?.key ? "selected-row" : ""
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="reconcile-row-button"
                          onClick={() => setSelectedAgencyKey(row.key)}
                        >
                          {row.name}
                        </button>
                      </td>
                      <td>
                        <ConfidenceBadge confidence={row.matchConfidence} />
                      </td>
                      <td>
                        {row.operating
                          ? formatMoney(row.operating.dollarAmount)
                          : "No match"}
                      </td>
                      <td>
                        {row.vendor
                          ? formatMoney(row.vendor.dollarAmount)
                          : "No match"}
                      </td>
                      <td>
                        {row.grants
                          ? formatMoney(row.grants.dollarAmount)
                          : "No match"}
                      </td>
                      <td>
                        {row.capital
                          ? formatMoney(row.capital.dollarAmount)
                          : "No match"}
                      </td>
                      <td>
                        {row.paymentScale === null
                          ? "Not comparable"
                          : formatPercent(row.paymentScale)}
                      </td>
                      <td>
                        {row.grantScale === null
                          ? "Not comparable"
                          : formatPercent(row.grantScale)}
                      </td>
                      <td>
                        {row.capitalScale === null
                          ? "Not comparable"
                          : formatPercent(row.capitalScale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No agencies match the current filters.</p>
          )}
        </div>

        <aside className="reconciliation-detail" aria-live="polite">
          {selectedAgency ? (
            <>
              <div className="coverage-detail-heading">
                <div>
                  <span>{selectedAgency.matchStatus}</span>
                  <h3>{selectedAgency.name}</h3>
                </div>
                <ConfidenceBadge confidence={selectedAgency.matchConfidence} />
              </div>

              <div className="reconciliation-source-grid">
                <article>
                  <span>Operating allocation</span>
                  <strong>
                    {selectedAgency.operating
                      ? formatFullMoney(selectedAgency.operating.dollarAmount)
                      : "No match"}
                  </strong>
                  <small>
                    {selectedAgency.operating
                      ? `${formatPercent(
                          selectedAgency.operating.percentage
                        )} of current operating view`
                      : "Not visible in current filters"}
                  </small>
                </article>
                <article>
                  <span>Vendor payments</span>
                  <strong>
                    {selectedAgency.vendor
                      ? formatFullMoney(selectedAgency.vendor.dollarAmount)
                      : "No match"}
                  </strong>
                  <small>
                    {selectedAgency.vendor
                      ? `${formatPercent(
                          selectedAgency.vendor.percentage
                        )} of payment total`
                      : "Not visible in payment top-agency rows"}
                  </small>
                </article>
                <article>
                  <span>Grants and loans</span>
                  <strong>
                    {selectedAgency.grants
                      ? formatFullMoney(selectedAgency.grants.dollarAmount)
                      : "No match"}
                  </strong>
                  <small>
                    {selectedAgency.grants
                      ? `${formatPercent(
                          selectedAgency.grants.percentage
                        )} of grants/loans total`
                      : "Not visible in grant/loan top-agency rows"}
                  </small>
                </article>
                <article>
                  <span>Capital authorizations</span>
                  <strong>
                    {selectedAgency.capital
                      ? formatFullMoney(selectedAgency.capital.dollarAmount)
                      : "No match"}
                  </strong>
                  <small>
                    {selectedAgency.capital
                      ? `${formatPercent(
                          selectedAgency.capital.percentage
                        )} of capital total`
                      : "Not visible in capital rows"}
                  </small>
                </article>
              </div>

              <div className="reconciliation-notes">
                <h4>Gaps And Exclusions To Check</h4>
                <ul>
                  {getGapItems(selectedAgency).map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="reconciliation-notes">
                <h4>Published Labels Matched</h4>
                <ul>
                  {getSourceNames(selectedAgency).map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>

              <div className="reconciliation-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!selectedAgency.operating}
                  onClick={() => onOpenOperatingAgency(selectedAgency.operating?.name)}
                >
                  Open operating rows
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!selectedAgency.vendor}
                  onClick={() => onOpenVendorAgency(selectedAgency.vendor?.name)}
                >
                  Open payment rows
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!selectedAgency.grants}
                  onClick={() =>
                    onOpenGrantLoanAgency(
                      selectedAgency.grants?.sourceNames?.[0] ||
                        selectedAgency.grants?.name
                    )
                  }
                >
                  Open grant/loan rows
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!selectedAgency.capital}
                  onClick={() => onOpenCapitalAgency(selectedAgency.capital?.name)}
                >
                  Open capital rows
                </button>
              </div>
            </>
          ) : (
            <p className="empty-state">Select an agency to inspect source matches.</p>
          )}
        </aside>
      </section>

      <footer className="panel-footnote">
        Agency reconciliation uses normalized published labels and a small set of
        Maryland-specific aliases. It is designed to guide review and trace
        work, not to certify audited matches across budget, payment, grant/loan,
        and capital systems.
      </footer>
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
          detail={`${formatNumber(liveSources)} official source adapters connected`}
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
            <CoverageStatusBadge status="Live" />
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

function FundingSourceBars({ rows }) {
  const maxAmount = rows[0]?.dollarAmount || 0;

  if (!rows.length) {
    return <p className="empty-state">No funding-source rows match the current filters.</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row, index) => {
        const width = maxAmount > 0 ? (row.dollarAmount / maxAmount) * 100 : 0;

        return (
          <div
            className="bar-row"
            key={`${row.fiscalYear}-${row.agencyName}-${row.programName}-${row.fundSourceCode}-${row.categoryTitle}-${index}`}
          >
            <div className="bar-row-top">
              <span>{row.fundSourceName}</span>
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
                {row.programName} / {row.fundType} / {row.fundSourceCode} /{" "}
                {formatPercent(row.percentage)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FundingSourcesPanel({
  fundingSourceYears,
  selectedFundingYear,
  onSelectedFundingYearChange,
  fundingSearchQuery,
  onFundingSearchQueryChange,
  fundingFundTypeFilter,
  onFundingFundTypeFilterChange,
  fundingSourceFilter,
  onFundingSourceFilterChange,
  fundingAgencyFilter,
  onFundingAgencyFilterChange,
  fundingCategoryFilter,
  onFundingCategoryFilterChange,
  fundingSourceDetail,
  loading,
  errorMessage,
  onTraceFundingSource,
  onExportFundingSources,
  onCopyCitation,
  onCopyViewLink,
}) {
  const metadata = fundingSourceDetail?.metadata || DEFAULT_FUNDING_SOURCE_METADATA;
  const fundingRows = fundingSourceDetail?.fundingRows || [];
  const topFundingRows = fundingRows.slice(0, 10);
  const topFundSource = fundingSourceDetail?.fundSources?.[0];
  const fundTypeOptions = fundingSourceDetail?.fundTypes || [];
  const fundSourceOptions = fundingSourceDetail?.fundSources || [];
  const agencyOptions = fundingSourceDetail?.topAgencies || [];
  const categoryOptions = fundingSourceDetail?.categories || [];
  const sourcePageUrl = metadata.sourcePageUrl || metadata.budgetPageUrl;

  return (
    <section className="funding-source-section">
      <section className="panel vendor-overview-panel">
        <div className="panel-heading">
          <div>
            <h2>Funding Source Explorer</h2>
            <p>
              Search official Maryland operating-budget funding-source rows by
              fiscal year, fund type, fund source, agency, program, category,
              and description.
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
            <span>Budget stage</span>
            <strong>No stage field</strong>
          </div>
          <div>
            <span>DBM page</span>
            <a href={sourcePageUrl} target="_blank" rel="noreferrer">
              Operating budget
            </a>
          </div>
        </div>

        <div className="funding-controls" aria-label="Funding source controls">
          <div className="control-field">
            <label htmlFor="funding-year-select">Funding fiscal year</label>
            <select
              id="funding-year-select"
              value={selectedFundingYear}
              onChange={(event) => onSelectedFundingYearChange(event.target.value)}
              disabled={loading || !fundingSourceYears.length}
            >
              {fundingSourceYears.map((year) => (
                <option key={year.fiscalYear} value={year.fiscalYear}>
                  FY {year.fiscalYear}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field control-field-wide">
            <label htmlFor="funding-search-input">Funding search</label>
            <input
              id="funding-search-input"
              type="search"
              placeholder="Fund source, agency, program, category, or description"
              value={fundingSearchQuery}
              onChange={(event) => onFundingSearchQueryChange(event.target.value)}
              disabled={loading || !selectedFundingYear}
            />
          </div>

          <div className="control-field">
            <label htmlFor="funding-fund-type-filter">Fund type</label>
            <select
              id="funding-fund-type-filter"
              value={fundingFundTypeFilter}
              onChange={(event) => onFundingFundTypeFilterChange(event.target.value)}
              disabled={loading || !fundingSourceDetail}
            >
              <option value="all">All fund types</option>
              {fundTypeOptions.map((fundType) => (
                <option key={fundType.name} value={fundType.name}>
                  {fundType.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="funding-source-filter">Fund source</label>
            <select
              id="funding-source-filter"
              value={fundingSourceFilter}
              onChange={(event) => onFundingSourceFilterChange(event.target.value)}
              disabled={loading || !fundingSourceDetail}
            >
              <option value="all">All fund sources</option>
              {fundSourceOptions.map((source) => (
                <option
                  key={`${source.fundType}-${source.fundSourceCode}-${source.fundSourceName}`}
                  value={source.fundSourceName}
                >
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="funding-agency-filter">Funding agency</label>
            <select
              id="funding-agency-filter"
              value={fundingAgencyFilter}
              onChange={(event) => onFundingAgencyFilterChange(event.target.value)}
              disabled={loading || !fundingSourceDetail}
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
            <label htmlFor="funding-category-filter">Budget category</label>
            <select
              id="funding-category-filter"
              value={fundingCategoryFilter}
              onChange={(event) => onFundingCategoryFilterChange(event.target.value)}
              disabled={loading || !fundingSourceDetail}
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
            <p>Loading FY {selectedFundingYear || ""} funding sources...</p>
          </section>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </section>

      {fundingSourceDetail && !loading && (
        <>
          <div className="comparison-grid">
            <MetricCard
              label={`FY ${fundingSourceDetail.fiscalYear} funding-source total`}
              value={formatMoney(fundingSourceDetail.totalAmount)}
              detail={formatFullMoney(fundingSourceDetail.totalAmount)}
            />
            <MetricCard
              label="Funding rows in source"
              value={formatNumber(fundingSourceDetail.rowCount)}
              detail="Rows after active funding filters"
            />
            <MetricCard
              label="Grouped funding rows returned"
              value={formatNumber(fundingRows.length)}
              detail={`Top grouped rows, capped at ${formatNumber(
                fundingSourceDetail.sourceLimit
              )}`}
            />
            <MetricCard
              label="General Fund share"
              value={formatPercent(fundingSourceDetail.generalFundShare)}
              detail={`${formatMoney(
                fundingSourceDetail.generalFundTotal
              )} in General Fund rows`}
            />
            <MetricCard
              label="Top fund source in view"
              value={topFundSource ? formatMoney(topFundSource.dollarAmount) : "$0"}
              detail={topFundSource?.name || "No fund-source rows returned"}
            />
          </div>

          <section className="dashboard-grid funding-dashboard-grid">
            <section className="panel panel-large funding-nested-panel">
              <div className="panel-heading">
                <div>
                  <h3>Largest Funding Sources</h3>
                  <p>
                    Grouped by agency, program, fund type, fund source, category,
                    and description after active filters.
                  </p>
                </div>
                <span>{formatNumber(fundingRows.length)} rows</span>
              </div>

              <FundingSourceBars rows={topFundingRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown
                title="Fund Types In View"
                rows={fundingSourceDetail.fundTypes}
              />
              <MiniBreakdown
                title="Top Fund Sources"
                rows={fundingSourceDetail.fundSources.slice(0, 12)}
              />
              <MiniBreakdown
                title="Top Agencies In View"
                rows={fundingSourceDetail.topAgencies.slice(0, 12)}
              />
            </div>
          </section>

          <section className="table-panel funding-table-panel">
            <div className="panel-heading">
              <div>
                <h3>Funding Source Detail</h3>
                <p>
                  Showing {formatNumber(fundingRows.length)} grouped rows from
                  FY {fundingSourceDetail.fiscalYear}.
                  {fundingSourceDetail.isRowCapped
                    ? ` The table returns the top ${formatNumber(
                        fundingSourceDetail.sourceLimit
                      )} grouped funding rows.`
                    : ""}
                </p>
              </div>
              <span>{formatMoney(fundingSourceDetail.totalAmount)}</span>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onExportFundingSources}
                disabled={!fundingRows.length}
              >
                Export funding CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCopyCitation}
              >
                Copy funding source
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
                    <th>Fund Type</th>
                    <th>Fund Source</th>
                    <th>Code</th>
                    <th>Agency</th>
                    <th>Program</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>Rows</th>
                    <th>Confidence</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {fundingRows.map((row, index) => (
                    <tr
                      key={`${row.fiscalYear}-${row.agencyName}-${row.programName}-${row.fundType}-${row.fundSourceCode}-${row.categoryTitle}-${index}`}
                    >
                      <td>FY {row.fiscalYear}</td>
                      <td>{row.fundType}</td>
                      <td>{row.fundSourceName}</td>
                      <td>{row.fundSourceCode}</td>
                      <td>{row.agencyName}</td>
                      <td>{row.programName}</td>
                      <td>{row.categoryTitle}</td>
                      <td>{row.description}</td>
                      <td>{formatFullMoney(row.dollarAmount)}</td>
                      <td>{formatPercent(row.percentage)}</td>
                      <td>{formatNumber(row.rowCount)}</td>
                      <td>
                        <ConfidenceBadge confidence={row.confidence} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="trace-button"
                          onClick={() => onTraceFundingSource(row)}
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
            {fundingSourceDetail.isRowCapped
              ? ` The grouped funding table is capped at ${formatNumber(
                  fundingSourceDetail.sourceLimit
                )} rows; the all-row funding-source total exceeds returned grouped rows by ${formatFullMoney(
                  fundingSourceDetail.rowDifference
                )}.`
              : ""}
          </footer>
        </>
      )}
    </section>
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

function GrantLoanBars({ rows }) {
  const maxAmount = rows[0]?.dollarAmount || 0;

  if (!rows.length) {
    return <p className="empty-state">No grants or loans match the current filters.</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row, index) => {
        const width = maxAmount > 0 ? (row.dollarAmount / maxAmount) * 100 : 0;

        return (
          <div
            className="bar-row"
            key={`${row.fiscalYear}-${row.grantor}-${row.granteeName}-${row.category}-${index}`}
          >
            <div className="bar-row-top">
              <span>{row.granteeName}</span>
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
                {row.category} / {row.recipientZip} /{" "}
                {formatNumber(row.awardCount)} rows /{" "}
                {formatPercent(row.percentage)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrantsLoansPanel({
  grantLoanYears,
  selectedGrantLoanYear,
  onSelectedGrantLoanYearChange,
  grantLoanSearchQuery,
  onGrantLoanSearchQueryChange,
  grantorFilter,
  onGrantorFilterChange,
  grantLoanCategoryFilter,
  onGrantLoanCategoryFilterChange,
  grantLoanZipFilter,
  onGrantLoanZipFilterChange,
  grantLoanDetail,
  loading,
  errorMessage,
  onTraceAward,
  onExportAwards,
  onCopyCitation,
  onCopyViewLink,
}) {
  const metadata = grantLoanDetail?.metadata || DEFAULT_GRANTS_LOANS_METADATA;
  const awards = grantLoanDetail?.awards || [];
  const topAwardRows = awards.slice(0, 10);
  const topRecipient = grantLoanDetail?.topRecipients?.[0];
  const grantorOptions = grantLoanDetail?.topGrantors || [];
  const categoryOptions = grantLoanDetail?.categories || [];
  const zipOptions = grantLoanDetail?.zipCodes || [];

  return (
    <section className="grant-loan-section">
      <section className="panel vendor-overview-panel">
        <div className="panel-heading">
          <div>
            <h2>Grants & Loans Explorer</h2>
            <p>
              Search official Maryland State Aid grant and loan records by
              recipient, grantor, category, ZIP code, description, and fiscal
              year. These are assistance records, not operating allocations.
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
            <span>Threshold</span>
            <strong>$50,000+</strong>
          </div>
          <div>
            <span>Portal</span>
            <a href={metadata.portalUrl} target="_blank" rel="noreferrer">
              Grants and loans
            </a>
          </div>
        </div>

        <div className="grant-controls" aria-label="Grant and loan controls">
          <div className="control-field">
            <label htmlFor="grant-loan-year-select">Grant/loan fiscal year</label>
            <select
              id="grant-loan-year-select"
              value={selectedGrantLoanYear}
              onChange={(event) => onSelectedGrantLoanYearChange(event.target.value)}
              disabled={loading || !grantLoanYears.length}
            >
              {grantLoanYears.map((year) => (
                <option key={year.fiscalYear} value={year.fiscalYear}>
                  FY {year.fiscalYear}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field control-field-wide">
            <label htmlFor="grant-loan-search-input">Recipient search</label>
            <input
              id="grant-loan-search-input"
              type="search"
              placeholder="Recipient, grantor, description, category, or ZIP"
              value={grantLoanSearchQuery}
              onChange={(event) => onGrantLoanSearchQueryChange(event.target.value)}
              disabled={loading || !selectedGrantLoanYear}
            />
          </div>

          <div className="control-field">
            <label htmlFor="grantor-filter">Grantor</label>
            <select
              id="grantor-filter"
              value={grantorFilter}
              onChange={(event) => onGrantorFilterChange(event.target.value)}
              disabled={loading || !grantLoanDetail}
            >
              <option value="all">All grantors</option>
              {grantorOptions.map((grantor) => (
                <option key={grantor.name} value={grantor.name}>
                  {grantor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="grant-loan-category-filter">Category</label>
            <select
              id="grant-loan-category-filter"
              value={grantLoanCategoryFilter}
              onChange={(event) =>
                onGrantLoanCategoryFilterChange(event.target.value)
              }
              disabled={loading || !grantLoanDetail}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="grant-loan-zip-filter">Recipient ZIP</label>
            <select
              id="grant-loan-zip-filter"
              value={grantLoanZipFilter}
              onChange={(event) => onGrantLoanZipFilterChange(event.target.value)}
              disabled={loading || !grantLoanDetail}
            >
              <option value="all">All ZIP codes</option>
              {zipOptions.map((zipCode) => (
                <option key={zipCode.name} value={zipCode.name}>
                  {zipCode.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <section className="loading-panel vendor-loading-panel" aria-live="polite">
            <div className="spinner" />
            <p>Loading FY {selectedGrantLoanYear || ""} grants and loans...</p>
          </section>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </section>

      {grantLoanDetail && !loading && (
        <>
          <div className="comparison-grid">
            <MetricCard
              label={`FY ${grantLoanDetail.fiscalYear} grant/loan total`}
              value={formatMoney(grantLoanDetail.totalAmount)}
              detail={formatFullMoney(grantLoanDetail.totalAmount)}
            />
            <MetricCard
              label="Award rows in source"
              value={formatNumber(grantLoanDetail.rowCount)}
              detail="Rows after active grant/loan filters"
            />
            <MetricCard
              label="Grouped awards returned"
              value={formatNumber(awards.length)}
              detail={`Top grouped recipient rows, capped at ${formatNumber(
                grantLoanDetail.awardLimit
              )}`}
            />
            <MetricCard
              label="Top recipient in view"
              value={topRecipient ? formatMoney(topRecipient.dollarAmount) : "$0"}
              detail={topRecipient?.name || "No recipient rows returned"}
            />
          </div>

          <section className="dashboard-grid vendor-dashboard-grid">
            <section className="panel panel-large vendor-nested-panel">
              <div className="panel-heading">
                <div>
                  <h3>Largest Grants And Loans</h3>
                  <p>
                    Grouped by grantor, recipient, category, description, fiscal
                    period, date, and ZIP code after active filters.
                  </p>
                </div>
                <span>{formatNumber(awards.length)} rows</span>
              </div>

              <GrantLoanBars rows={topAwardRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown
                title="Top Recipients In View"
                rows={grantLoanDetail.topRecipients}
              />
              <MiniBreakdown
                title="Grant/Loan Categories"
                rows={grantLoanDetail.categories.slice(0, 12)}
              />
              <MiniBreakdown
                title="Recipient ZIP Codes"
                rows={grantLoanDetail.zipCodes.slice(0, 12)}
              />
            </div>
          </section>

          <section className="table-panel vendor-table-panel">
            <div className="panel-heading">
              <div>
                <h3>Grant And Loan Detail</h3>
                <p>
                  Showing {formatNumber(awards.length)} grouped rows from FY{" "}
                  {grantLoanDetail.fiscalYear}.
                  {grantLoanDetail.isAwardCapped
                    ? ` The table returns the top ${formatNumber(
                        grantLoanDetail.awardLimit
                      )} grouped award rows.`
                    : ""}
                </p>
              </div>
              <span>{formatMoney(grantLoanDetail.totalAmount)}</span>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onExportAwards}
                disabled={!awards.length}
              >
                Export grant/loan CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCopyCitation}
              >
                Copy grant/loan source
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
                    <th>Grantor</th>
                    <th>Recipient</th>
                    <th>Category</th>
                    <th>ZIP</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>Rows</th>
                    <th>Confidence</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {awards.map((award, index) => (
                    <tr
                      key={`${award.fiscalYear}-${award.grantor}-${award.granteeName}-${award.recipientZip}-${award.category}-${index}`}
                    >
                      <td>FY {award.fiscalYear}</td>
                      <td>{award.grantor}</td>
                      <td>{award.granteeName}</td>
                      <td>{award.category}</td>
                      <td>{award.recipientZip}</td>
                      <td>{award.description}</td>
                      <td>{formatFullMoney(award.dollarAmount)}</td>
                      <td>{formatPercent(award.percentage)}</td>
                      <td>{formatNumber(award.awardCount)}</td>
                      <td>
                        <ConfidenceBadge confidence={award.confidence} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="trace-button"
                          onClick={() => onTraceAward(award)}
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
            {grantLoanDetail.isAwardCapped
              ? ` The grouped award table is capped at ${formatNumber(
                  grantLoanDetail.awardLimit
                )} rows; the all-row grant/loan total exceeds returned grouped rows by ${formatFullMoney(
                  grantLoanDetail.awardDifference
                )}.`
              : ""}
          </footer>
        </>
      )}
    </section>
  );
}

function CapitalProjectBars({ rows }) {
  const maxAmount = rows[0]?.dollarAmount || 0;

  if (!rows.length) {
    return <p className="empty-state">No capital projects match the current filters.</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row, index) => {
        const width = maxAmount > 0 ? (row.dollarAmount / maxAmount) * 100 : 0;

        return (
          <div className="bar-row" key={row.id}>
            <div className="bar-row-top">
              <span>{row.projectTitle}</span>
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
                {row.county} / {row.fundType} / {row.projectType} /{" "}
                {formatPercent(row.percentage)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapitalProjectsPanel({
  capitalProjectYears,
  selectedCapitalYear,
  onSelectedCapitalYearChange,
  capitalSearchQuery,
  onCapitalSearchQueryChange,
  capitalAgencyFilter,
  onCapitalAgencyFilterChange,
  capitalCountyFilter,
  onCapitalCountyFilterChange,
  capitalCategoryFilter,
  onCapitalCategoryFilterChange,
  capitalFundTypeFilter,
  onCapitalFundTypeFilterChange,
  capitalProjectTypeFilter,
  onCapitalProjectTypeFilterChange,
  capitalProjectDetail,
  loading,
  errorMessage,
  onTraceProject,
  onExportProjects,
  onCopyCitation,
  onCopyViewLink,
}) {
  const metadata = capitalProjectDetail?.metadata || DEFAULT_CAPITAL_PROJECT_METADATA;
  const projects = capitalProjectDetail?.projects || [];
  const topProjectRows = projects.slice(0, 10);
  const topProject = projects[0];
  const agencyOptions = capitalProjectDetail?.topAgencies || [];
  const countyOptions = capitalProjectDetail?.topCounties || [];
  const categoryOptions = capitalProjectDetail?.categories || [];
  const fundTypeOptions = capitalProjectDetail?.fundTypes || [];
  const projectTypeOptions = capitalProjectDetail?.projectTypes || [];

  return (
    <section className="capital-project-section">
      <section className="panel capital-overview-panel">
        <div className="panel-heading">
          <div>
            <h2>Capital Project Explorer</h2>
            <p>
              Search official Maryland capital-budget project and program
              authorizations by agency, county, category, fund type, and fiscal
              year.
            </p>
          </div>
          <CoverageStatusBadge status="Live" />
        </div>

        <div className="vendor-source-strip capital-source-strip">
          <div>
            <span>Official source</span>
            <a href={metadata.sourceUrl} target="_blank" rel="noreferrer">
              {metadata.sourceLabel}
            </a>
          </div>
          <div>
            <span>Budget stage</span>
            <strong>Enacted</strong>
          </div>
          <div>
            <span>Frequency</span>
            <strong>{metadata.updateFrequency}</strong>
          </div>
          <div>
            <span>DBM page</span>
            <a href={metadata.sourcePageUrl} target="_blank" rel="noreferrer">
              Capital budget
            </a>
          </div>
        </div>

        <div className="capital-controls" aria-label="Capital project controls">
          <div className="control-field">
            <label htmlFor="capital-year-select">Capital fiscal year</label>
            <select
              id="capital-year-select"
              value={selectedCapitalYear}
              onChange={(event) => onSelectedCapitalYearChange(event.target.value)}
              disabled={loading || !capitalProjectYears.length}
            >
              {capitalProjectYears.map((year) => (
                <option key={year.fiscalYear} value={year.fiscalYear}>
                  FY {year.fiscalYear} / {year.budgetStage}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field control-field-wide">
            <label htmlFor="capital-search-input">Capital search</label>
            <input
              id="capital-search-input"
              type="search"
              placeholder="Project, agency, county, category, or fund"
              value={capitalSearchQuery}
              onChange={(event) => onCapitalSearchQueryChange(event.target.value)}
              disabled={loading || !selectedCapitalYear}
            />
          </div>

          <div className="control-field">
            <label htmlFor="capital-agency-filter">Capital agency</label>
            <select
              id="capital-agency-filter"
              value={capitalAgencyFilter}
              onChange={(event) => onCapitalAgencyFilterChange(event.target.value)}
              disabled={loading || !capitalProjectDetail}
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
            <label htmlFor="capital-county-filter">County</label>
            <select
              id="capital-county-filter"
              value={capitalCountyFilter}
              onChange={(event) => onCapitalCountyFilterChange(event.target.value)}
              disabled={loading || !capitalProjectDetail}
            >
              <option value="all">All counties</option>
              {countyOptions.map((county) => (
                <option key={county.name} value={county.name}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="capital-category-filter">Capital category</label>
            <select
              id="capital-category-filter"
              value={capitalCategoryFilter}
              onChange={(event) => onCapitalCategoryFilterChange(event.target.value)}
              disabled={loading || !capitalProjectDetail}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="capital-fund-filter">Capital fund type</label>
            <select
              id="capital-fund-filter"
              value={capitalFundTypeFilter}
              onChange={(event) => onCapitalFundTypeFilterChange(event.target.value)}
              disabled={loading || !capitalProjectDetail}
            >
              <option value="all">All fund types</option>
              {fundTypeOptions.map((fund) => (
                <option key={fund.name} value={fund.name}>
                  {fund.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="capital-type-filter">Record type</label>
            <select
              id="capital-type-filter"
              value={capitalProjectTypeFilter}
              onChange={(event) => onCapitalProjectTypeFilterChange(event.target.value)}
              disabled={loading || !capitalProjectDetail}
            >
              <option value="all">All record types</option>
              {projectTypeOptions.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <section className="loading-panel vendor-loading-panel" aria-live="polite">
            <div className="spinner" />
            <p>Loading FY {selectedCapitalYear || ""} capital projects...</p>
          </section>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </section>

      {capitalProjectDetail && !loading && (
        <>
          <div className="comparison-grid">
            <MetricCard
              label={`FY ${capitalProjectDetail.fiscalYear} enacted capital total`}
              value={formatMoney(capitalProjectDetail.totalAmount)}
              detail={formatFullMoney(capitalProjectDetail.totalAmount)}
            />
            <MetricCard
              label="Filtered capital rows"
              value={formatNumber(capitalProjectDetail.rowCount)}
              detail={`${formatMoney(
                capitalProjectDetail.filteredTotal
              )} across matching records`}
            />
            <MetricCard
              label="Pre-deauthorization total"
              value={formatMoney(capitalProjectDetail.authorizedBeforeDeauthorizations)}
              detail={`${formatMoney(
                capitalProjectDetail.deauthorizations
              )} in deauthorizations/reversions`}
            />
            <MetricCard
              label="Largest row in view"
              value={topProject ? formatMoney(topProject.dollarAmount) : "$0"}
              detail={topProject?.projectTitle || "No capital rows returned"}
            />
          </div>

          <section className="dashboard-grid capital-dashboard-grid">
            <section className="panel panel-large capital-nested-panel">
              <div className="panel-heading">
                <div>
                  <h3>Largest Capital Authorizations</h3>
                  <p>
                    Project and program rows from the enacted capital-budget
                    document after active filters.
                  </p>
                </div>
                <span>{formatNumber(projects.length)} rows</span>
              </div>

              <CapitalProjectBars rows={topProjectRows} />
            </section>

            <div className="side-stack">
              <MiniBreakdown
                title="Capital Fund Summary"
                rows={capitalProjectDetail.fundSummary}
              />
              <MiniBreakdown
                title="Counties In View"
                rows={capitalProjectDetail.topCounties.slice(0, 12)}
              />
            </div>
          </section>

          <section className="table-panel capital-table-panel">
            <div className="panel-heading">
              <div>
                <h3>Capital Project Detail</h3>
                <p>
                  Showing {formatNumber(projects.length)} normalized rows from
                  FY {capitalProjectDetail.fiscalYear} enacted capital-budget
                  detail.
                </p>
              </div>
              <span>{formatMoney(capitalProjectDetail.filteredTotal)}</span>
            </div>

            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onExportProjects}
                disabled={!projects.length}
              >
                Export capital CSV
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCopyCitation}
              >
                Copy capital source
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
                    <th>County</th>
                    <th>Project / Program</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Fund Type</th>
                    <th>Amount</th>
                    <th>Share</th>
                    <th>PDF Page</th>
                    <th>Confidence</th>
                    <th>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>FY {project.fiscalYear}</td>
                      <td>{project.agencyName}</td>
                      <td>{project.county}</td>
                      <td>{project.projectTitle}</td>
                      <td>{project.category}</td>
                      <td>{project.projectType}</td>
                      <td>{project.fundType}</td>
                      <td>{formatFullMoney(project.dollarAmount)}</td>
                      <td>{formatPercent(project.percentage)}</td>
                      <td>{project.sourcePage}</td>
                      <td>
                        <ConfidenceBadge confidence={project.confidence} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="trace-button"
                          onClick={() => onTraceProject(project)}
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
  const isFundingTrace = row.traceType === "Funding source";
  const isCapitalTrace = row.traceType === "Capital project";
  const isGrantTrace = row.traceType === "Grant/loan award";
  const totalLabel = row.traceTotalLabel || "selected-year operating budget total";
  const traceLabel = isVendorTrace
    ? "Vendor payment trace"
    : isFundingTrace
      ? "Funding source trace"
    : isCapitalTrace
      ? "Capital project trace"
      : isGrantTrace
        ? "Grant/loan trace"
        : "Allocation trace";

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
            <span>{traceLabel}</span>
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
            <span>
              {isVendorTrace
                ? "Payment category/code"
                : isFundingTrace
                  ? "Fund source"
                : isCapitalTrace
                  ? "County"
                  : isGrantTrace
                    ? "Grantor"
                    : "Department"}
            </span>
            <strong>{row.unitName}</strong>
          </div>
          <div>
            <span>
              {isVendorTrace
                ? "Category/code"
                : isFundingTrace
                  ? "Budget category"
                : isCapitalTrace
                  ? "Capital category"
                  : isGrantTrace
                    ? "Assistance category"
                    : "Category"}
            </span>
            <strong>{row.categoryTitle}</strong>
          </div>
          <div>
            <span>
              {isVendorTrace
                ? "Vendor ZIP"
                : isGrantTrace
                  ? "Recipient ZIP"
                  : "Fund type"}
            </span>
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
  const [initialFundingYearRequest] = useState(() => getQueryValue("fundingYear"));
  const [initialGrantLoanYearRequest] = useState(() => getQueryValue("grantLoanYear"));
  const [initialCapitalYearRequest] = useState(() => getQueryValue("capitalYear"));
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
  const [fundingSourceYears, setFundingSourceYears] = useState([]);
  const [selectedFundingYear, setSelectedFundingYear] = useState("");
  const [fundingSourceDetail, setFundingSourceDetail] = useState(null);
  const [grantLoanYears, setGrantLoanYears] = useState([]);
  const [selectedGrantLoanYear, setSelectedGrantLoanYear] = useState("");
  const [grantLoanDetail, setGrantLoanDetail] = useState(null);
  const [capitalProjectYears, setCapitalProjectYears] = useState([]);
  const [selectedCapitalYear, setSelectedCapitalYear] = useState("");
  const [capitalProjectDetail, setCapitalProjectDetail] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(getInitialAnalysisMode);
  const [questionMode, setQuestionMode] = useState(() => {
    const initialQuestion = getQueryOption(
      "question",
      QUESTION_OPTIONS.map((option) => option.value),
      "latest"
    );

    return ["compare", "reconcile"].includes(analysisMode) &&
      [
        "vendor_payments",
        "funding_sources",
        "grants_loans",
        "capital_projects",
        "education_outcomes",
      ].includes(
        initialQuestion
      )
      ? "latest"
      : initialQuestion;
  });
  const [coverageSourceId, setCoverageSourceId] = useState(
    getQueryCoverageSourceId
  );
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingVendorYears, setLoadingVendorYears] = useState(false);
  const [loadingVendorPayments, setLoadingVendorPayments] = useState(false);
  const [loadingFundingYears, setLoadingFundingYears] = useState(false);
  const [loadingFundingSources, setLoadingFundingSources] = useState(false);
  const [loadingGrantLoanYears, setLoadingGrantLoanYears] = useState(false);
  const [loadingGrantLoans, setLoadingGrantLoans] = useState(false);
  const [loadingCapitalYears, setLoadingCapitalYears] = useState(false);
  const [loadingCapitalProjects, setLoadingCapitalProjects] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendorErrorMessage, setVendorErrorMessage] = useState("");
  const [fundingErrorMessage, setFundingErrorMessage] = useState("");
  const [grantLoanErrorMessage, setGrantLoanErrorMessage] = useState("");
  const [capitalErrorMessage, setCapitalErrorMessage] = useState("");
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
  const [fundingSearchQuery, setFundingSearchQuery] = useState(() =>
    getQueryValue("fundingSearch")
  );
  const [fundingFundTypeFilter, setFundingFundTypeFilter] = useState(
    () => getQueryValue("fundingFundType") || "all"
  );
  const [fundingSourceFilter, setFundingSourceFilter] = useState(
    () => getQueryValue("fundingSource") || "all"
  );
  const [fundingAgencyFilter, setFundingAgencyFilter] = useState(
    () => getQueryValue("fundingAgency") || "all"
  );
  const [fundingCategoryFilter, setFundingCategoryFilter] = useState(
    () => getQueryValue("fundingCategory") || "all"
  );
  const [grantLoanSearchQuery, setGrantLoanSearchQuery] = useState(() =>
    getQueryValue("grantSearch")
  );
  const [grantorFilter, setGrantorFilter] = useState(
    () => getQueryValue("grantor") || "all"
  );
  const [grantLoanCategoryFilter, setGrantLoanCategoryFilter] = useState(
    () => getQueryValue("grantCategory") || "all"
  );
  const [grantLoanZipFilter, setGrantLoanZipFilter] = useState(
    () => getQueryValue("grantZip") || "all"
  );
  const [capitalSearchQuery, setCapitalSearchQuery] = useState(() =>
    getQueryValue("capitalSearch")
  );
  const [capitalAgencyFilter, setCapitalAgencyFilter] = useState(
    () => getQueryValue("capitalAgency") || "all"
  );
  const [capitalCountyFilter, setCapitalCountyFilter] = useState(
    () => getQueryValue("capitalCounty") || "all"
  );
  const [capitalCategoryFilter, setCapitalCategoryFilter] = useState(
    () => getQueryValue("capitalCategory") || "all"
  );
  const [capitalFundTypeFilter, setCapitalFundTypeFilter] = useState(
    () => getQueryValue("capitalFund") || "all"
  );
  const [capitalProjectTypeFilter, setCapitalProjectTypeFilter] = useState(
    () => getQueryValue("capitalType") || "all"
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
    setFundingSearchQuery("");
    setFundingFundTypeFilter("all");
    setFundingSourceFilter("all");
    setFundingAgencyFilter("all");
    setFundingCategoryFilter("all");
    setGrantLoanSearchQuery("");
    setGrantorFilter("all");
    setGrantLoanCategoryFilter("all");
    setGrantLoanZipFilter("all");
    setCapitalSearchQuery("");
    setCapitalAgencyFilter("all");
    setCapitalCountyFilter("all");
    setCapitalCategoryFilter("all");
    setCapitalFundTypeFilter("all");
    setCapitalProjectTypeFilter("all");
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
    setFundingSourceYears([]);
    setSelectedFundingYear("");
    setFundingSourceDetail(null);
    setGrantLoanYears([]);
    setSelectedGrantLoanYear("");
    setGrantLoanDetail(null);
    setCapitalProjectYears([]);
    setSelectedCapitalYear("");
    setCapitalProjectDetail(null);
    setSourceMetadata(DEFAULT_SOURCE_METADATA);
    setErrorMessage("");
    setVendorErrorMessage("");
    setFundingErrorMessage("");
    setGrantLoanErrorMessage("");
    setCapitalErrorMessage("");
    setTraceMessage("");
    setTraceRow(null);
    setLoadingYears(false);
    setLoadingDetail(false);
    setLoadingVendorYears(false);
    setLoadingVendorPayments(false);
    setLoadingFundingYears(false);
    setLoadingFundingSources(false);
    setLoadingGrantLoanYears(false);
    setLoadingGrantLoans(false);
    setLoadingCapitalYears(false);
    setLoadingCapitalProjects(false);
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
    } else if (value === "funding_sources") {
      setAnalysisMode("funding");
      setCoverageSourceId("budget-funding-sources");
    } else if (value === "grants_loans") {
      setAnalysisMode("grants");
      setCoverageSourceId("grants-loans");
    } else if (value === "capital_projects") {
      setAnalysisMode("capital");
      setCoverageSourceId("capital-budget");
    } else if (
      analysisMode === "accountability" ||
      analysisMode === "coverage" ||
      analysisMode === "payments" ||
      analysisMode === "funding" ||
      analysisMode === "grants" ||
      analysisMode === "capital"
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

    if (value === "funding") {
      if (questionMode !== "funding_sources") {
        setQuestionMode("funding_sources");
      }
      setCoverageSourceId("budget-funding-sources");
      return;
    }

    if (value === "grants") {
      if (questionMode !== "grants_loans") {
        setQuestionMode("grants_loans");
      }
      setCoverageSourceId("grants-loans");
      return;
    }

    if (value === "capital") {
      if (questionMode !== "capital_projects") {
        setQuestionMode("capital_projects");
      }
      setCoverageSourceId("capital-budget");
      return;
    }

    if (value === "accountability") {
      if (questionMode !== "education_outcomes") {
        setQuestionMode("education_outcomes");
      }
      return;
    }

    if (value === "compare" || value === "reconcile") {
      setCoverageSourceId("operating-budget");
    }

    if (
      questionMode === "vendor_payments" ||
      questionMode === "funding_sources" ||
      questionMode === "grants_loans" ||
      questionMode === "capital_projects" ||
      questionMode === "education_outcomes"
    ) {
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
    const needsFundingSources =
      questionMode === "funding_sources" || analysisMode === "compare";

    if (!activeStateCode || !needsFundingSources) return undefined;

    const controller = new AbortController();

    async function loadFundingYears() {
      setLoadingFundingYears(true);
      setFundingErrorMessage("");

      try {
        const payload = await fetchFundingSourceYears(controller.signal);
        const years = payload.years;

        if (!years.length) {
          throw new Error("No Maryland funding-source years were returned.");
        }

        setFundingSourceYears(years);
        const requestedYear = years.find(
          (year) =>
            String(year.fiscalYear) === String(initialFundingYearRequest) ||
            String(year.fiscalYear) === String(selectedYear)
        );
        setSelectedFundingYear(String((requestedYear || years[0]).fiscalYear));
      } catch (error) {
        if (error.name !== "AbortError") {
          setFundingErrorMessage(error.message);
        }
      } finally {
        setLoadingFundingYears(false);
      }
    }

    loadFundingYears();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    initialFundingYearRequest,
    questionMode,
    selectedYear,
  ]);

  useEffect(() => {
    const needsFundingSources =
      questionMode === "funding_sources" || analysisMode === "compare";

    if (!activeStateCode || !needsFundingSources || !selectedFundingYear) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadFundingSources() {
      setFundingSourceDetail(null);
      setLoadingFundingSources(true);
      setFundingErrorMessage("");
      setTraceMessage("");
      setTraceRow(null);

      try {
        const detail = await fetchFundingSourceDetail(
          {
            fiscalYear: Number(selectedFundingYear),
            searchQuery: analysisMode === "compare" ? "" : fundingSearchQuery,
            fundTypeFilter:
              analysisMode === "compare" ? "all" : fundingFundTypeFilter,
            fundSourceFilter:
              analysisMode === "compare" ? "all" : fundingSourceFilter,
            agencyFilter:
              analysisMode === "compare" ? "all" : fundingAgencyFilter,
            categoryFilter:
              analysisMode === "compare" ? "all" : fundingCategoryFilter,
          },
          controller.signal
        );

        if (!detail) {
          throw new Error(
            `No funding-source detail was returned for FY ${selectedFundingYear}.`
          );
        }

        setFundingSourceDetail(detail);
      } catch (error) {
        if (error.name !== "AbortError") {
          setFundingErrorMessage(error.message);
        }
      } finally {
        setLoadingFundingSources(false);
      }
    }

    loadFundingSources();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    fundingAgencyFilter,
    fundingCategoryFilter,
    fundingFundTypeFilter,
    fundingSearchQuery,
    fundingSourceFilter,
    questionMode,
    selectedFundingYear,
  ]);

  useEffect(() => {
    const needsVendorPayments =
      questionMode === "vendor_payments" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (!activeStateCode || !needsVendorPayments) return undefined;

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
  }, [
    activeStateCode,
    analysisMode,
    initialVendorYearRequest,
    questionMode,
    selectedYear,
  ]);

  useEffect(() => {
    const needsVendorPayments =
      questionMode === "vendor_payments" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (
      !activeStateCode ||
      !needsVendorPayments ||
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
            searchQuery:
              ["compare", "reconcile"].includes(analysisMode)
                ? ""
                : vendorSearchQuery,
            agencyFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : vendorAgencyFilter,
            categoryFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : vendorCategoryFilter,
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
    analysisMode,
    questionMode,
    selectedVendorYear,
    vendorAgencyFilter,
    vendorCategoryFilter,
    vendorSearchQuery,
  ]);

  useEffect(() => {
    const needsGrantLoans =
      questionMode === "grants_loans" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (!activeStateCode || !needsGrantLoans) return undefined;

    const controller = new AbortController();

    async function loadGrantLoanYears() {
      setLoadingGrantLoanYears(true);
      setGrantLoanErrorMessage("");

      try {
        const payload = await fetchGrantLoanYears(controller.signal);
        const years = payload.years;

        if (!years.length) {
          throw new Error("No Maryland grant and loan years were returned.");
        }

        setGrantLoanYears(years);
        const requestedYear = years.find(
          (year) =>
            String(year.fiscalYear) === String(initialGrantLoanYearRequest) ||
            String(year.fiscalYear) === String(selectedYear)
        );
        setSelectedGrantLoanYear(String((requestedYear || years[0]).fiscalYear));
      } catch (error) {
        if (error.name !== "AbortError") {
          setGrantLoanErrorMessage(error.message);
        }
      } finally {
        setLoadingGrantLoanYears(false);
      }
    }

    loadGrantLoanYears();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    initialGrantLoanYearRequest,
    questionMode,
    selectedYear,
  ]);

  useEffect(() => {
    const needsGrantLoans =
      questionMode === "grants_loans" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (!activeStateCode || !needsGrantLoans || !selectedGrantLoanYear) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadGrantLoans() {
      setGrantLoanDetail(null);
      setLoadingGrantLoans(true);
      setGrantLoanErrorMessage("");
      setTraceMessage("");
      setTraceRow(null);

      try {
        const detail = await fetchGrantLoanDetail(
          {
            fiscalYear: Number(selectedGrantLoanYear),
            searchQuery:
              ["compare", "reconcile"].includes(analysisMode)
                ? ""
                : grantLoanSearchQuery,
            grantorFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : grantorFilter,
            categoryFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : grantLoanCategoryFilter,
            zipCodeFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : grantLoanZipFilter,
          },
          controller.signal
        );

        if (!detail) {
          throw new Error(
            `No grant and loan detail was returned for FY ${selectedGrantLoanYear}.`
          );
        }

        setGrantLoanDetail(detail);
      } catch (error) {
        if (error.name !== "AbortError") {
          setGrantLoanErrorMessage(error.message);
        }
      } finally {
        setLoadingGrantLoans(false);
      }
    }

    loadGrantLoans();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    grantLoanCategoryFilter,
    grantLoanSearchQuery,
    grantLoanZipFilter,
    grantorFilter,
    questionMode,
    selectedGrantLoanYear,
  ]);

  useEffect(() => {
    const needsCapitalProjects =
      questionMode === "capital_projects" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (!activeStateCode || !needsCapitalProjects) return undefined;

    const controller = new AbortController();

    async function loadCapitalYears() {
      setLoadingCapitalYears(true);
      setCapitalErrorMessage("");

      try {
        const payload = await fetchCapitalProjectYears(controller.signal);
        const years = payload.years;

        if (!years.length) {
          throw new Error("No Maryland capital-project years were returned.");
        }

        setCapitalProjectYears(years);
        const requestedYear = years.find(
          (year) =>
            String(year.fiscalYear) === String(initialCapitalYearRequest) ||
            String(year.fiscalYear) === String(selectedYear)
        );
        setSelectedCapitalYear(String((requestedYear || years[0]).fiscalYear));
      } catch (error) {
        if (error.name !== "AbortError") {
          setCapitalErrorMessage(error.message);
        }
      } finally {
        setLoadingCapitalYears(false);
      }
    }

    loadCapitalYears();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    initialCapitalYearRequest,
    questionMode,
    selectedYear,
  ]);

  useEffect(() => {
    const needsCapitalProjects =
      questionMode === "capital_projects" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile";

    if (
      !activeStateCode ||
      !needsCapitalProjects ||
      !selectedCapitalYear
    ) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCapitalProjects() {
      setCapitalProjectDetail(null);
      setLoadingCapitalProjects(true);
      setCapitalErrorMessage("");
      setTraceMessage("");
      setTraceRow(null);

      try {
        const detail = await fetchCapitalProjectDetail(
          {
            fiscalYear: Number(selectedCapitalYear),
            searchQuery:
              ["compare", "reconcile"].includes(analysisMode)
                ? ""
                : capitalSearchQuery,
            agencyFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : capitalAgencyFilter,
            countyFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : capitalCountyFilter,
            categoryFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : capitalCategoryFilter,
            fundTypeFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : capitalFundTypeFilter,
            projectTypeFilter:
              ["compare", "reconcile"].includes(analysisMode)
                ? "all"
                : capitalProjectTypeFilter,
          },
          controller.signal
        );

        if (!detail) {
          throw new Error(
            `No capital-project detail was returned for FY ${selectedCapitalYear}.`
          );
        }

        setCapitalProjectDetail(detail);
      } catch (error) {
        if (error.name !== "AbortError") {
          setCapitalErrorMessage(error.message);
        }
      } finally {
        setLoadingCapitalProjects(false);
      }
    }

    loadCapitalProjects();

    return () => controller.abort();
  }, [
    activeStateCode,
    analysisMode,
    capitalAgencyFilter,
    capitalCategoryFilter,
    capitalCountyFilter,
    capitalFundTypeFilter,
    capitalProjectTypeFilter,
    capitalSearchQuery,
    questionMode,
    selectedCapitalYear,
  ]);

  useEffect(() => {
    if (!activeStateCode || typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("state", activeStateCode);
    if (selectedYear) params.set("year", selectedYear);
    params.set("mode", analysisMode);
    params.set("question", questionMode);
    if (
      analysisMode === "coverage" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile" ||
      questionMode === "vendor_payments" ||
      questionMode === "funding_sources" ||
      questionMode === "grants_loans" ||
      questionMode === "capital_projects"
    ) {
      params.set("source", coverageSourceId);
    }
    if (
      questionMode === "funding_sources" ||
      analysisMode === "compare"
    ) {
      if (selectedFundingYear) params.set("fundingYear", selectedFundingYear);
      if (questionMode === "funding_sources" && fundingSearchQuery.trim()) {
        params.set("fundingSearch", fundingSearchQuery.trim());
      }
      if (
        questionMode === "funding_sources" &&
        fundingFundTypeFilter !== "all"
      ) {
        params.set("fundingFundType", fundingFundTypeFilter);
      }
      if (questionMode === "funding_sources" && fundingSourceFilter !== "all") {
        params.set("fundingSource", fundingSourceFilter);
      }
      if (questionMode === "funding_sources" && fundingAgencyFilter !== "all") {
        params.set("fundingAgency", fundingAgencyFilter);
      }
      if (questionMode === "funding_sources" && fundingCategoryFilter !== "all") {
        params.set("fundingCategory", fundingCategoryFilter);
      }
    }
    if (
      questionMode === "vendor_payments" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile"
    ) {
      if (selectedVendorYear) params.set("paymentYear", selectedVendorYear);
      if (questionMode === "vendor_payments" && vendorSearchQuery.trim()) {
        params.set("vendorSearch", vendorSearchQuery.trim());
      }
      if (questionMode === "vendor_payments" && vendorAgencyFilter !== "all") {
        params.set("vendorAgency", vendorAgencyFilter);
      }
      if (questionMode === "vendor_payments" && vendorCategoryFilter !== "all") {
        params.set("vendorCategory", vendorCategoryFilter);
      }
    }
    if (
      questionMode === "grants_loans" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile"
    ) {
      if (selectedGrantLoanYear) {
        params.set("grantLoanYear", selectedGrantLoanYear);
      }
      if (questionMode === "grants_loans" && grantLoanSearchQuery.trim()) {
        params.set("grantSearch", grantLoanSearchQuery.trim());
      }
      if (questionMode === "grants_loans" && grantorFilter !== "all") {
        params.set("grantor", grantorFilter);
      }
      if (
        questionMode === "grants_loans" &&
        grantLoanCategoryFilter !== "all"
      ) {
        params.set("grantCategory", grantLoanCategoryFilter);
      }
      if (questionMode === "grants_loans" && grantLoanZipFilter !== "all") {
        params.set("grantZip", grantLoanZipFilter);
      }
    }
    if (
      questionMode === "capital_projects" ||
      analysisMode === "compare" ||
      analysisMode === "reconcile"
    ) {
      if (selectedCapitalYear) params.set("capitalYear", selectedCapitalYear);
      if (questionMode === "capital_projects" && capitalSearchQuery.trim()) {
        params.set("capitalSearch", capitalSearchQuery.trim());
      }
      if (questionMode === "capital_projects" && capitalAgencyFilter !== "all") {
        params.set("capitalAgency", capitalAgencyFilter);
      }
      if (questionMode === "capital_projects" && capitalCountyFilter !== "all") {
        params.set("capitalCounty", capitalCountyFilter);
      }
      if (questionMode === "capital_projects" && capitalCategoryFilter !== "all") {
        params.set("capitalCategory", capitalCategoryFilter);
      }
      if (
        questionMode === "capital_projects" &&
        capitalFundTypeFilter !== "all"
      ) {
        params.set("capitalFund", capitalFundTypeFilter);
      }
      if (
        questionMode === "capital_projects" &&
        capitalProjectTypeFilter !== "all"
      ) {
        params.set("capitalType", capitalProjectTypeFilter);
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
    capitalAgencyFilter,
    capitalCategoryFilter,
    capitalCountyFilter,
    capitalFundTypeFilter,
    capitalProjectTypeFilter,
    capitalSearchQuery,
    categoryFilter,
    coverageSourceId,
    fundFilter,
    fundingAgencyFilter,
    fundingCategoryFilter,
    fundingFundTypeFilter,
    fundingSearchQuery,
    fundingSourceFilter,
    grantLoanCategoryFilter,
    grantLoanSearchQuery,
    grantLoanZipFilter,
    grantorFilter,
    questionMode,
    rowLimit,
    searchQuery,
    selectedCapitalYear,
    selectedFundingYear,
    selectedGrantLoanYear,
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
  const comparisonMetadata = {
    ...metadata,
    coverage:
      analysisMode === "reconcile"
        ? "This reconciliation view matches connected Maryland operating-budget agencies, vendor-payment agency summaries, grant/loan grantor summaries, and FY 2027 enacted capital-budget agency/project rows using normalized published labels."
        : "This comparison uses connected Maryland operating-budget allocations, funding-source rows, vendor-payment summaries, grants/loans, and FY 2027 enacted capital-budget project/program authorizations while keeping source definitions separate.",
    confidenceReason:
      analysisMode === "reconcile"
        ? "Official Maryland sources are connected; match confidence reflects label alignment and source coverage rather than audited accounting reconciliation."
        : "Official Maryland sources are connected for the operating-budget, funding-source, vendor-payment, grants/loans, and capital-budget comparison streams.",
    knownExclusions: [
      "Audited payment-to-program reconciliation keys",
      "Audited fund-source-to-payment reconciliation keys",
      "Procurement contract identifiers matched to every payment",
      "Recipient-level grant/loan awards below the $50,000 reporting threshold",
      "Capital project-to-vendor payment matching",
      "Local school district and local government ledgers",
      "Capital-project years beyond the connected FY 2027 enacted document",
    ],
  };
  const displayMetadata =
    analysisMode === "compare" || analysisMode === "reconcile"
      ? comparisonMetadata
      : questionMode === "vendor_payments"
      ? vendorPaymentDetail?.metadata || DEFAULT_VENDOR_PAYMENT_METADATA
      : questionMode === "funding_sources"
        ? fundingSourceDetail?.metadata || DEFAULT_FUNDING_SOURCE_METADATA
      : questionMode === "grants_loans"
        ? grantLoanDetail?.metadata || DEFAULT_GRANTS_LOANS_METADATA
      : questionMode === "capital_projects"
        ? capitalProjectDetail?.metadata || DEFAULT_CAPITAL_PROJECT_METADATA
      : metadata;
  const displaySourceLastUpdated =
    questionMode === "vendor_payments"
      ? displayMetadata.dataLastUpdated || VENDOR_PAYMENTS_LAST_UPDATED
      : questionMode === "funding_sources"
        ? displayMetadata.dataLastUpdated || FUNDING_SOURCE_LAST_UPDATED
      : questionMode === "grants_loans"
        ? displayMetadata.dataLastUpdated || GRANTS_LOANS_LAST_UPDATED
      : questionMode === "capital_projects"
        ? displayMetadata.dataLastUpdated || CAPITAL_PROJECTS_LAST_UPDATED
      : SOURCE_LAST_MODIFIED;
  const displayMetadataUpdated =
    questionMode === "vendor_payments"
      ? displayMetadata.metadataUpdated || VENDOR_PAYMENTS_METADATA_UPDATED
      : questionMode === "funding_sources"
        ? displayMetadata.metadataUpdated || FUNDING_SOURCE_METADATA_UPDATED
      : questionMode === "grants_loans"
        ? displayMetadata.metadataUpdated || GRANTS_LOANS_METADATA_UPDATED
      : questionMode === "capital_projects"
        ? displayMetadata.metadataUpdated || CAPITAL_PROJECTS_METADATA_UPDATED
      : SOURCE_METADATA_UPDATED;
  const activeQuestion =
    QUESTION_OPTIONS.find((option) => option.value === questionMode) ||
    QUESTION_OPTIONS[0];
  const hidesAllocationTable =
    questionMode === "vendor_payments" ||
    questionMode === "funding_sources" ||
    questionMode === "grants_loans" ||
    questionMode === "capital_projects" ||
    questionMode === "education_outcomes";
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
    vendorCategoryFilter !== "all" ||
    fundingSearchQuery.trim() ||
    fundingFundTypeFilter !== "all" ||
    fundingSourceFilter !== "all" ||
    fundingAgencyFilter !== "all" ||
    fundingCategoryFilter !== "all" ||
    grantLoanSearchQuery.trim() ||
    grantorFilter !== "all" ||
    grantLoanCategoryFilter !== "all" ||
    grantLoanZipFilter !== "all" ||
    capitalSearchQuery.trim() ||
    capitalAgencyFilter !== "all" ||
    capitalCountyFilter !== "all" ||
    capitalCategoryFilter !== "all" ||
    capitalFundTypeFilter !== "all" ||
    capitalProjectTypeFilter !== "all";

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

  function exportFundingSourceCsv() {
    const fundingRows = fundingSourceDetail?.fundingRows || [];

    if (!fundingRows.length) return;

    const headers = [
      "Fiscal Year",
      "Agency",
      "Agency Code",
      "Unit",
      "Unit Code",
      "Program",
      "Program Code",
      "Fund Type",
      "Fund Source",
      "Fund Source Code",
      "Category",
      "Description",
      "Amount",
      "% Funding Source Total",
      "Source Rows",
      "Source",
      "Confidence",
      "Notes",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...fundingRows.map((row) =>
        [
          row.fiscalYear,
          row.agencyName,
          row.agencyCode,
          row.unitName,
          row.unitCode,
          row.programName,
          row.programCode,
          row.fundType,
          row.fundSourceName,
          row.fundSourceCode,
          row.categoryTitle,
          row.description,
          row.dollarAmount,
          row.percentage.toFixed(4),
          row.rowCount,
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
    link.download = `maryland-funding-sources-fy-${selectedFundingYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTraceMessage(
      `Exported ${fundingRows.length} grouped funding-source rows as CSV.`
    );
  }

  function exportGrantLoanCsv() {
    const awards = grantLoanDetail?.awards || [];

    if (!awards.length) return;

    const headers = [
      "Fiscal Year",
      "Grantor",
      "Agency",
      "Recipient",
      "Recipient ZIP",
      "Category",
      "Description",
      "Fiscal Period",
      "Date",
      "Amount",
      "% Grant/Loan Total",
      "Award Rows",
      "Source",
      "Confidence",
      "Notes",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...awards.map((award) =>
        [
          award.fiscalYear,
          award.grantor,
          award.agencyName,
          award.granteeName,
          award.recipientZip,
          award.category,
          award.description,
          award.fiscalPeriod,
          award.date,
          award.dollarAmount,
          award.percentage.toFixed(4),
          award.awardCount,
          award.sourceLabel,
          award.confidence,
          award.notes,
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
    link.download = `maryland-grants-loans-fy-${selectedGrantLoanYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTraceMessage(`Exported ${awards.length} grouped grant/loan rows as CSV.`);
  }

  function exportCapitalProjectCsv() {
    const projects = capitalProjectDetail?.projects || [];

    if (!projects.length) return;

    const headers = [
      "Fiscal Year",
      "Budget Stage",
      "Agency",
      "County",
      "Project / Program",
      "Category",
      "Record Type",
      "Fund Type",
      "Amount",
      "% FY Capital Total",
      "PDF Page",
      "Source",
      "Confidence",
      "Notes",
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...projects.map((project) =>
        [
          project.fiscalYear,
          project.budgetStage,
          project.agencyName,
          project.county,
          project.projectTitle,
          project.category,
          project.projectType,
          project.fundType,
          project.dollarAmount,
          project.percentage.toFixed(4),
          project.sourcePage,
          project.sourceLabel,
          project.confidence,
          project.notes,
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
    link.download = `maryland-capital-projects-fy-${selectedCapitalYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTraceMessage(`Exported ${projects.length} capital-project rows as CSV.`);
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
    const publisher =
      questionMode === "capital_projects"
        ? "Maryland Department of Budget and Management"
        : "Maryland Open Data";
    const citation = `${displayMetadata.sourceLabel}. ${publisher}. ${displayMetadata.sourceUrl}. Data last modified ${displaySourceLastUpdated}; metadata updated ${displayMetadataUpdated}.`;

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

  function handleFundingSourceTrace(row) {
    setTraceRow(buildFundingSourceTraceRow(row, fundingSourceDetail));
    setTraceMessage(`Trace opened for ${row.fundSourceName}.`);
  }

  function handleGrantLoanTrace(award) {
    setTraceRow(buildGrantLoanTraceRow(award, grantLoanDetail));
    setTraceMessage(`Trace opened for ${award.granteeName}.`);
  }

  function handleCapitalTrace(project) {
    setTraceRow(buildCapitalTraceRow(project, capitalProjectDetail));
    setTraceMessage(`Trace opened for ${project.projectTitle}.`);
  }

  function openOperatingAgencyRows(agencyName) {
    if (!agencyName) return;

    setQuestionMode("latest");
    setAnalysisMode("overview");
    setCoverageSourceId("operating-budget");
    setSearchQuery("");
    setAgencyFilter(agencyName);
    setTraceMessage(`Operating rows filtered to ${agencyName}.`);
    setTraceRow(null);
  }

  function openVendorAgencyRows(agencyName) {
    if (!agencyName) return;

    setQuestionMode("vendor_payments");
    setAnalysisMode("payments");
    setCoverageSourceId("vendor-payments");
    setVendorSearchQuery("");
    setVendorAgencyFilter(agencyName);
    setVendorCategoryFilter("all");
    setTraceMessage(`Vendor payment rows filtered to ${agencyName}.`);
    setTraceRow(null);
  }

  function openGrantLoanAgencyRows(grantorName) {
    if (!grantorName) return;

    setQuestionMode("grants_loans");
    setAnalysisMode("grants");
    setCoverageSourceId("grants-loans");
    setGrantLoanSearchQuery("");
    setGrantorFilter(grantorName);
    setGrantLoanCategoryFilter("all");
    setGrantLoanZipFilter("all");
    setTraceMessage(`Grant and loan rows filtered to ${grantorName}.`);
    setTraceRow(null);
  }

  function openCapitalAgencyRows(agencyName) {
    if (!agencyName) return;

    setQuestionMode("capital_projects");
    setAnalysisMode("capital");
    setCoverageSourceId("capital-budget");
    setCapitalSearchQuery("");
    setCapitalAgencyFilter(agencyName);
    setCapitalCountyFilter("all");
    setCapitalCategoryFilter("all");
    setCapitalFundTypeFilter("all");
    setCapitalProjectTypeFilter("all");
    setTraceMessage(`Capital project rows filtered to ${agencyName}.`);
    setTraceRow(null);
  }

  const activeStateName = activeState?.name || "Selected state";
  const heroModeLabel =
    analysisMode === "compare"
      ? "budget comparison"
      : analysisMode === "reconcile"
        ? "agency reconciliation"
      : questionMode === "vendor_payments"
      ? "vendor payments"
      : questionMode === "funding_sources"
        ? "funding sources"
      : questionMode === "grants_loans"
        ? "grants and loans"
      : questionMode === "capital_projects"
        ? "capital budget"
        : "operating budget";
  const heroTitle =
    analysisMode === "compare"
      ? `${activeStateName} Budget Comparison`
      : analysisMode === "reconcile"
        ? `${activeStateName} Agency Reconciliation`
      : questionMode === "vendor_payments"
      ? `${activeStateName} Vendor Payments`
      : questionMode === "funding_sources"
        ? `${activeStateName} Funding Sources`
      : questionMode === "grants_loans"
        ? `${activeStateName} Grants And Loans`
      : questionMode === "capital_projects"
        ? `${activeStateName} Capital Projects`
        : `${activeStateName} Operating Budget`;
  const heroDescription =
    analysisMode === "compare"
      ? "Compare operating-budget allocations, official funding-source rows, vendor-payment records, grants/loans, and enacted capital-budget authorizations while keeping each source's definition visible."
      : analysisMode === "reconcile"
        ? "Match agency labels across operating-budget allocations, vendor-payment records, grants/loans, and capital-project authorizations with confidence flags and source-specific drill-ins."
      : questionMode === "vendor_payments"
      ? "Explore official vendor-payment records beside operating-budget context without mixing transaction data into budget allocations."
      : questionMode === "funding_sources"
        ? "Explore official operating-budget funding-source rows beside allocation context without mixing fund-source analysis into payment or capital ledgers."
      : questionMode === "grants_loans"
        ? "Explore official grant and loan recipient records beside operating-budget context without mixing State Aid assistance records into budget allocations."
      : questionMode === "capital_projects"
        ? "Explore enacted capital-budget projects and programs beside operating-budget context without mixing long-term authorizations into recurring allocations."
        : "Explore official operating-budget allocations by year, stage, agency, program, category, and fund type. Education outcomes are connected through official MSDE and NCES/NAEP releases, and broader budget sources are mapped separately.";

  if (!activeState) {
    return (
      <main className="page page-centered">
        <section className="welcome-screen">
          <div className="welcome-copy">
            <p className="eyebrow">Public spending accountability</p>
            <h1>Choose a state budget to explore</h1>
            <p>
              Explore official state budget allocations and prepare them for
              comparison with public outcomes. Maryland operating-budget,
              vendor-payment, grant/loan, capital-project, and education
              outcome context are connected first.
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
          <p className="eyebrow">
            {activeState.name} state {heroModeLabel}
          </p>
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
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
          {questionMode === "funding_sources" && selectedFundingYear && (
            <>
              <span>Funding fiscal year</span>
              <StageBadge stage={`FY ${selectedFundingYear}`} />
            </>
          )}
          {questionMode === "grants_loans" && selectedGrantLoanYear && (
            <>
              <span>Grant/loan fiscal year</span>
              <StageBadge stage={`FY ${selectedGrantLoanYear}`} />
            </>
          )}
          {questionMode === "capital_projects" && selectedCapitalYear && (
            <>
              <span>Capital fiscal year</span>
              <StageBadge stage={`FY ${selectedCapitalYear} Enacted`} />
            </>
          )}
          {questionMode !== "vendor_payments" &&
            questionMode !== "funding_sources" &&
            questionMode !== "grants_loans" &&
            questionMode !== "capital_projects" &&
            budgetDetail?.budgetStage && (
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
        analysisMode={analysisMode}
      />

      {(loadingYears ||
        loadingDetail ||
        loadingVendorYears ||
        loadingFundingYears ||
        loadingGrantLoanYears ||
        loadingCapitalYears) && (
        <section className="loading-panel" aria-live="polite">
          <div className="spinner" />
          <p>
            {loadingYears
              ? "Loading fiscal years..."
              : loadingVendorYears
                ? "Loading vendor-payment fiscal years..."
              : loadingFundingYears
                ? "Loading funding-source fiscal years..."
                : loadingGrantLoanYears
                  ? "Loading grant/loan fiscal years..."
                : loadingCapitalYears
                  ? "Loading capital-project fiscal years..."
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
              analysisMode === "compare"
                ? "Cross-source comparison"
                : analysisMode === "reconcile"
                  ? "Agency reconciliation"
                  : questionMode === "vendor_payments"
                ? "Vendor payments"
                : questionMode === "funding_sources"
                  ? "Funding sources"
                : questionMode === "grants_loans"
                  ? "Grants and loans"
                : questionMode === "capital_projects"
                  ? "Capital projects"
                : budgetDetail.budgetStage
            }
          />

          <section
            className="metrics-grid"
            aria-label={
              analysisMode === "reconcile"
                ? "Budget agency reconciliation summary"
                : questionMode === "vendor_payments"
                ? "Budget and vendor payment summary"
                : questionMode === "funding_sources"
                  ? "Budget and funding-source summary"
                : questionMode === "grants_loans"
                  ? "Budget and grants/loans summary"
                : questionMode === "capital_projects"
                  ? "Budget and capital project summary"
                : "Budget summary"
            }
          >
            <MetricCard
              label={
                questionMode === "vendor_payments"
                  ? `FY ${budgetDetail.fiscalYear} operating-budget total`
                  : questionMode === "funding_sources"
                    ? `FY ${budgetDetail.fiscalYear} operating-budget total`
                  : questionMode === "grants_loans"
                    ? `FY ${budgetDetail.fiscalYear} operating-budget total`
                  : questionMode === "capital_projects"
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
                  : questionMode === "funding_sources"
                    ? "Operating-budget line items"
                  : questionMode === "grants_loans"
                    ? "Operating-budget line items"
                  : questionMode === "capital_projects"
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
                  : questionMode === "funding_sources"
                    ? "Grouped budget allocations returned"
                  : questionMode === "grants_loans"
                    ? "Grouped budget allocations returned"
                  : questionMode === "capital_projects"
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
                  : questionMode === "funding_sources"
                    ? "Operating-budget stage"
                  : questionMode === "grants_loans"
                    ? "Operating-budget stage"
                  : questionMode === "capital_projects"
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
                  : questionMode === "funding_sources"
                    ? `FY ${selectedFundingYear || "selected"} funding-source total`
                  : questionMode === "grants_loans"
                    ? `FY ${selectedGrantLoanYear || "selected"} grant/loan total`
                  : questionMode === "capital_projects"
                    ? `FY ${selectedCapitalYear || "selected"} capital total`
                  : "Current filter total"
              }
              value={
                questionMode === "vendor_payments"
                  ? formatMoney(vendorPaymentDetail?.totalAmount || 0)
                  : questionMode === "funding_sources"
                    ? formatMoney(fundingSourceDetail?.totalAmount || 0)
                  : questionMode === "grants_loans"
                    ? formatMoney(grantLoanDetail?.totalAmount || 0)
                  : questionMode === "capital_projects"
                    ? formatMoney(capitalProjectDetail?.totalAmount || 0)
                  : formatMoney(filteredTotal)
              }
              detail={
                questionMode === "vendor_payments"
                  ? vendorPaymentDetail
                    ? `${formatNumber(
                        vendorPaymentDetail.rowCount
                      )} payment rows in official source`
                    : "Vendor payments load from the separate source below"
                  : questionMode === "capital_projects"
                    ? capitalProjectDetail
                      ? `${formatNumber(
                          capitalProjectDetail.rowCount
                        )} capital rows in normalized source`
                      : "Capital projects load from the separate source below"
                  : questionMode === "funding_sources"
                    ? fundingSourceDetail
                      ? `${formatNumber(
                          fundingSourceDetail.rowCount
                        )} funding-source rows in official source`
                      : "Funding sources load from the separate source below"
                  : questionMode === "grants_loans"
                    ? grantLoanDetail
                      ? `${formatNumber(
                          grantLoanDetail.rowCount
                        )} grant/loan rows in official source`
                      : "Grants and loans load from the separate source below"
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
              fundingSourceYears={fundingSourceYears}
              selectedFundingYear={selectedFundingYear}
              onSelectedFundingYearChange={setSelectedFundingYear}
              fundingSourceDetail={fundingSourceDetail}
              loadingFundingYears={loadingFundingYears}
              loadingFundingSources={loadingFundingSources}
              fundingErrorMessage={fundingErrorMessage}
              vendorPaymentYears={vendorPaymentYears}
              selectedVendorYear={selectedVendorYear}
              onSelectedVendorYearChange={setSelectedVendorYear}
              vendorPaymentDetail={vendorPaymentDetail}
              loadingVendorYears={loadingVendorYears}
              loadingVendorPayments={loadingVendorPayments}
              vendorErrorMessage={vendorErrorMessage}
              grantLoanYears={grantLoanYears}
              selectedGrantLoanYear={selectedGrantLoanYear}
              onSelectedGrantLoanYearChange={setSelectedGrantLoanYear}
              grantLoanDetail={grantLoanDetail}
              loadingGrantLoanYears={loadingGrantLoanYears}
              loadingGrantLoans={loadingGrantLoans}
              grantLoanErrorMessage={grantLoanErrorMessage}
              capitalProjectYears={capitalProjectYears}
              selectedCapitalYear={selectedCapitalYear}
              onSelectedCapitalYearChange={setSelectedCapitalYear}
              capitalProjectDetail={capitalProjectDetail}
              loadingCapitalYears={loadingCapitalYears}
              loadingCapitalProjects={loadingCapitalProjects}
              capitalErrorMessage={capitalErrorMessage}
            />
          )}

          {analysisMode === "reconcile" && (
            <ReconciliationPanel
              budgetDetail={budgetDetail}
              filteredRows={filteredRows}
              vendorPaymentYears={vendorPaymentYears}
              selectedVendorYear={selectedVendorYear}
              onSelectedVendorYearChange={setSelectedVendorYear}
              vendorPaymentDetail={vendorPaymentDetail}
              loadingVendorYears={loadingVendorYears}
              loadingVendorPayments={loadingVendorPayments}
              vendorErrorMessage={vendorErrorMessage}
              grantLoanYears={grantLoanYears}
              selectedGrantLoanYear={selectedGrantLoanYear}
              onSelectedGrantLoanYearChange={setSelectedGrantLoanYear}
              grantLoanDetail={grantLoanDetail}
              loadingGrantLoanYears={loadingGrantLoanYears}
              loadingGrantLoans={loadingGrantLoans}
              grantLoanErrorMessage={grantLoanErrorMessage}
              capitalProjectYears={capitalProjectYears}
              selectedCapitalYear={selectedCapitalYear}
              onSelectedCapitalYearChange={setSelectedCapitalYear}
              capitalProjectDetail={capitalProjectDetail}
              loadingCapitalYears={loadingCapitalYears}
              loadingCapitalProjects={loadingCapitalProjects}
              capitalErrorMessage={capitalErrorMessage}
              onOpenOperatingAgency={openOperatingAgencyRows}
              onOpenVendorAgency={openVendorAgencyRows}
              onOpenGrantLoanAgency={openGrantLoanAgencyRows}
              onOpenCapitalAgency={openCapitalAgencyRows}
            />
          )}

          {(analysisMode === "funding" || questionMode === "funding_sources") && (
            <FundingSourcesPanel
              fundingSourceYears={fundingSourceYears}
              selectedFundingYear={selectedFundingYear}
              onSelectedFundingYearChange={setSelectedFundingYear}
              fundingSearchQuery={fundingSearchQuery}
              onFundingSearchQueryChange={setFundingSearchQuery}
              fundingFundTypeFilter={fundingFundTypeFilter}
              onFundingFundTypeFilterChange={setFundingFundTypeFilter}
              fundingSourceFilter={fundingSourceFilter}
              onFundingSourceFilterChange={setFundingSourceFilter}
              fundingAgencyFilter={fundingAgencyFilter}
              onFundingAgencyFilterChange={setFundingAgencyFilter}
              fundingCategoryFilter={fundingCategoryFilter}
              onFundingCategoryFilterChange={setFundingCategoryFilter}
              fundingSourceDetail={fundingSourceDetail}
              loading={loadingFundingSources}
              errorMessage={fundingErrorMessage}
              onTraceFundingSource={handleFundingSourceTrace}
              onExportFundingSources={exportFundingSourceCsv}
              onCopyCitation={copySourceCitation}
              onCopyViewLink={copyViewLink}
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

          {(analysisMode === "grants" || questionMode === "grants_loans") && (
            <GrantsLoansPanel
              grantLoanYears={grantLoanYears}
              selectedGrantLoanYear={selectedGrantLoanYear}
              onSelectedGrantLoanYearChange={setSelectedGrantLoanYear}
              grantLoanSearchQuery={grantLoanSearchQuery}
              onGrantLoanSearchQueryChange={setGrantLoanSearchQuery}
              grantorFilter={grantorFilter}
              onGrantorFilterChange={setGrantorFilter}
              grantLoanCategoryFilter={grantLoanCategoryFilter}
              onGrantLoanCategoryFilterChange={setGrantLoanCategoryFilter}
              grantLoanZipFilter={grantLoanZipFilter}
              onGrantLoanZipFilterChange={setGrantLoanZipFilter}
              grantLoanDetail={grantLoanDetail}
              loading={loadingGrantLoans}
              errorMessage={grantLoanErrorMessage}
              onTraceAward={handleGrantLoanTrace}
              onExportAwards={exportGrantLoanCsv}
              onCopyCitation={copySourceCitation}
              onCopyViewLink={copyViewLink}
            />
          )}

          {(analysisMode === "capital" || questionMode === "capital_projects") && (
            <CapitalProjectsPanel
              capitalProjectYears={capitalProjectYears}
              selectedCapitalYear={selectedCapitalYear}
              onSelectedCapitalYearChange={setSelectedCapitalYear}
              capitalSearchQuery={capitalSearchQuery}
              onCapitalSearchQueryChange={setCapitalSearchQuery}
              capitalAgencyFilter={capitalAgencyFilter}
              onCapitalAgencyFilterChange={setCapitalAgencyFilter}
              capitalCountyFilter={capitalCountyFilter}
              onCapitalCountyFilterChange={setCapitalCountyFilter}
              capitalCategoryFilter={capitalCategoryFilter}
              onCapitalCategoryFilterChange={setCapitalCategoryFilter}
              capitalFundTypeFilter={capitalFundTypeFilter}
              onCapitalFundTypeFilterChange={setCapitalFundTypeFilter}
              capitalProjectTypeFilter={capitalProjectTypeFilter}
              onCapitalProjectTypeFilterChange={setCapitalProjectTypeFilter}
              capitalProjectDetail={capitalProjectDetail}
              loading={loadingCapitalProjects}
              errorMessage={capitalErrorMessage}
              onTraceProject={handleCapitalTrace}
              onExportProjects={exportCapitalProjectCsv}
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

          {showsAllocationViews && (
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
              searchQuery:
                questionMode === "grants_loans"
                  ? grantLoanSearchQuery
                  : questionMode === "funding_sources"
                    ? fundingSearchQuery
                  : questionMode === "vendor_payments"
                    ? vendorSearchQuery
                  : questionMode === "capital_projects"
                  ? capitalSearchQuery
                  : searchQuery,
              agencyFilter:
                questionMode === "grants_loans"
                  ? grantorFilter
                  : questionMode === "funding_sources"
                    ? fundingAgencyFilter
                  : questionMode === "vendor_payments"
                    ? vendorAgencyFilter
                  : questionMode === "capital_projects"
                  ? capitalAgencyFilter
                  : agencyFilter,
              fundFilter:
                questionMode === "grants_loans"
                  ? grantLoanZipFilter
                  : questionMode === "funding_sources"
                    ? fundingFundTypeFilter
                  : questionMode === "capital_projects"
                  ? capitalFundTypeFilter
                  : fundFilter,
              budgetStageFilter,
              categoryFilter:
                questionMode === "grants_loans"
                  ? grantLoanCategoryFilter
                  : questionMode === "funding_sources"
                    ? fundingCategoryFilter
                  : questionMode === "vendor_payments"
                    ? vendorCategoryFilter
                  : questionMode === "capital_projects"
                  ? capitalCategoryFilter
                  : categoryFilter,
              traceContext:
                questionMode === "grants_loans"
                  ? "grants"
                  : questionMode === "funding_sources"
                    ? "funding"
                  : questionMode === "vendor_payments"
                    ? "vendor"
                    : questionMode === "capital_projects"
                      ? "capital"
                      : "operating",
              fundingSourceFilter:
                questionMode === "funding_sources"
                  ? fundingSourceFilter
                  : undefined,
              grantLoanZipFilter:
                questionMode === "grants_loans" ? grantLoanZipFilter : undefined,
              capitalCountyFilter:
                questionMode === "capital_projects"
                  ? capitalCountyFilter
                  : undefined,
              capitalProjectTypeFilter:
                questionMode === "capital_projects"
                  ? capitalProjectTypeFilter
                  : undefined,
            }}
            onClose={() => setTraceRow(null)}
            onCopy={copyTrace}
          />
        </>
      )}
    </main>
  );
}
