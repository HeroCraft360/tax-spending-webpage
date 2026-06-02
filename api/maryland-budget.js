const DATASET_ID = "yu65-jmmv";
const QUERY_URL = `https://opendata.maryland.gov/api/v3/views/${DATASET_ID}/query.json`;
const CACHE_HEADER = "s-maxage=1800, stale-while-revalidate=86400";
const DETAIL_ALLOCATION_LIMIT = 5000;
const SOURCE_METADATA = {
  state: "MD",
  sourceType: "Operating budget",
  sourceLabel: "Maryland Operating Budget (current)",
  sourceUrl:
    "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-current-/yu65-jmmv",
  confidence: "High",
  confidenceReason:
    "Official Maryland open-data budget source published through Maryland Open Data.",
  coverage:
    "This view currently uses Maryland operating budget open data. It may not include every tax dollar, every vendor payment, every capital project, or every local school district expenditure.",
  limitations: [
    "The current view is an allocation dashboard for the Maryland operating budget dataset.",
    "It should not be read as a complete transaction ledger or vendor-payment database.",
    "Capital projects and local school district spending may require separate official datasets.",
    "Budget values can change when Maryland updates the source dataset.",
  ],
  knownExclusions: [
    "Every tax-dollar-level transaction",
    "Vendor payments",
    "Standalone capital project records",
    "Local school district expenditure ledgers",
    "Postsecondary, debt, employment, research, and local outcome datasets",
  ],
  supportedQuestions: [
    "Latest budget allocations",
    "All funds in the selected fiscal year",
    "General Fund only",
    "Budget stage drilldown",
  ],
};

async function fetchSocrataRows(query, pageSize = 5000) {
  const response = await fetch(QUERY_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "MarylandBudgetExplorer/1.0",
    },
    body: JSON.stringify({
      query,
      page: {
        pageNumber: 1,
        pageSize,
      },
      includeSynthetic: false,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      "Maryland's open-data API did not return budget data.";
    throw new Error(message);
  }

  return Array.isArray(payload) ? payload : [];
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function getAmount(row) {
  return cleanNumber(row.dollar_amount || row.total_amount || row.budget);
}

function positiveBudgetWhere(fiscalYear) {
  return `fiscal_year=${fiscalYear} AND budget > 0`;
}

function normalizeBudgetStage(value) {
  const text = cleanText(value, "Unknown");
  const lower = text.toLowerCase();

  if (lower.includes("actual")) return "Actual";
  if (lower.includes("working")) return "Working Budget";
  if (lower.includes("appropr")) return "Legislative Appropriation";
  if (lower.includes("allowance")) return "Governor's Allowance";
  if (lower.includes("estim")) return "Estimated";

  return text;
}

function formatBudgetStages(stages) {
  const uniqueStages = [...new Set(stages.filter(Boolean))];
  return uniqueStages.length ? uniqueStages.join(", ") : "Unknown";
}

function normalizeBudgetYears(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const fiscalYear = cleanNumber(row.fiscal_year);

    if (!fiscalYear) continue;

    if (!grouped.has(fiscalYear)) {
      grouped.set(fiscalYear, {
        fiscalYear,
        totalAmount: 0,
        rowCount: 0,
        budgetStages: [],
      });
    }

    const year = grouped.get(fiscalYear);
    year.totalAmount += cleanNumber(row.total_amount);
    year.rowCount += cleanNumber(row.row_count);
    year.budgetStages.push(normalizeBudgetStage(row.type));
  }

  return [...grouped.values()]
    .map((year) => ({
      ...year,
      budgetStages: [...new Set(year.budgetStages)],
      budgetStage: formatBudgetStages(year.budgetStages),
    }))
    .sort((a, b) => b.fiscalYear - a.fiscalYear);
}

function summarizeBudgetStages(summaryRows) {
  const stages = summaryRows
    .map((row) => normalizeBudgetStage(row.type))
    .filter(Boolean);

  return {
    budgetStages: [...new Set(stages)],
    budgetStage: formatBudgetStages(stages),
  };
}

function normalizeAllocationRow(row, totalAmount, fiscalYear) {
  const dollarAmount = getAmount(row);

  return {
    fiscalYear,
    agencyName: cleanText(row.agency_name, "Unknown agency"),
    unitName: cleanText(row.unit_name, "Unknown unit"),
    programName: cleanText(row.program_name, "Uncategorized program"),
    subprogramName: cleanText(row.subprogram_name, "No subprogram listed"),
    categoryTitle: cleanText(row.category_title, "Uncategorized"),
    fundType: cleanText(row.fund_type_name, "Unknown fund type"),
    budgetStage: normalizeBudgetStage(row.type),
    sourceLabel: SOURCE_METADATA.sourceLabel,
    sourceUrl: SOURCE_METADATA.sourceUrl,
    confidence: SOURCE_METADATA.confidence,
    notes: SOURCE_METADATA.sourceType,
    dollarAmount,
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

function normalizeNamedTotal(row, nameField, fallback, totalAmount) {
  const dollarAmount = getAmount(row);

  return {
    name: cleanText(row[nameField], fallback),
    dollarAmount,
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

async function getBudgetYears() {
  const rows = await fetchSocrataRows(
    "SELECT fiscal_year, type, sum(budget) as total_amount, count(*) as row_count " +
      "WHERE budget > 0 " +
      "GROUP BY fiscal_year, type " +
      "ORDER BY fiscal_year DESC " +
      "LIMIT 120",
    120
  );

  return normalizeBudgetYears(rows)
    .filter((row) => row.fiscalYear > 0 && row.totalAmount > 0);
}

async function getBudgetDetail(fiscalYear) {
  const where = positiveBudgetWhere(fiscalYear);

  const [summaryRows, allocationRows, agencyRows, fundRows] = await Promise.all([
    fetchSocrataRows(
      `SELECT type, sum(budget) as total_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY type ORDER BY sum(budget) DESC LIMIT 24",
      24
    ),
    fetchSocrataRows(
      "SELECT agency_name, unit_name, program_name, subprogram_name, " +
        "category_title, fund_type_name, type, " +
        `sum(budget) as dollar_amount WHERE ${where} ` +
        "GROUP BY agency_name, unit_name, program_name, subprogram_name, " +
        "category_title, fund_type_name, type " +
        `ORDER BY sum(budget) DESC LIMIT ${DETAIL_ALLOCATION_LIMIT}`,
      DETAIL_ALLOCATION_LIMIT
    ),
    fetchSocrataRows(
      `SELECT agency_name, sum(budget) as dollar_amount WHERE ${where} ` +
        "GROUP BY agency_name ORDER BY sum(budget) DESC LIMIT 12",
      12
    ),
    fetchSocrataRows(
      `SELECT fund_type_name, sum(budget) as dollar_amount WHERE ${where} ` +
        "GROUP BY fund_type_name ORDER BY sum(budget) DESC LIMIT 12",
      12
    ),
  ]);

  const totalAmount = summaryRows.reduce(
    (sum, row) => sum + cleanNumber(row.total_amount),
    0
  );
  const rowCount = summaryRows.reduce(
    (sum, row) => sum + cleanNumber(row.row_count),
    0
  );
  const stageSummary = summarizeBudgetStages(summaryRows);
  const allocations = allocationRows
    .map((row) => normalizeAllocationRow(row, totalAmount, fiscalYear))
    .filter((row) => row.dollarAmount > 0);
  const allocationTotal = allocations.reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );

  return {
    fiscalYear,
    totalAmount,
    rowCount,
    allocationLimit: DETAIL_ALLOCATION_LIMIT,
    allocationTotal,
    allocationDifference: Math.max(totalAmount - allocationTotal, 0),
    isAllocationCapped: allocations.length >= DETAIL_ALLOCATION_LIMIT,
    ...stageSummary,
    metadata: SOURCE_METADATA,
    allocations,
    topAgencies: agencyRows
      .map((row) =>
        normalizeNamedTotal(row, "agency_name", "Unknown agency", totalAmount)
      )
      .filter((row) => row.dollarAmount > 0),
    fundTypes: fundRows
      .map((row) =>
        normalizeNamedTotal(
          row,
          "fund_type_name",
          "Unknown fund type",
          totalAmount
        )
      )
      .filter((row) => row.dollarAmount > 0),
  };
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", statusCode === 200 ? CACHE_HEADER : "no-store");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(request.url, "http://localhost");
  const view = url.searchParams.get("view");

  try {
    if (view === "years") {
      sendJson(response, 200, {
        metadata: SOURCE_METADATA,
        years: await getBudgetYears(),
      });
      return;
    }

    if (view === "detail") {
      const fiscalYear = cleanNumber(url.searchParams.get("fiscalYear"));

      if (!fiscalYear) {
        sendJson(response, 400, { error: "A fiscalYear query parameter is required." });
        return;
      }

      sendJson(response, 200, {
        detail: await getBudgetDetail(fiscalYear),
      });
      return;
    }

    sendJson(response, 400, { error: "Unknown Maryland budget API view." });
  } catch (error) {
    sendJson(response, 502, {
      error: error.message || "Could not load Maryland budget data.",
    });
  }
}
