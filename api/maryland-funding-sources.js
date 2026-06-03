const DATASET_ID = "gy87-e27x";
const QUERY_URL = `https://opendata.maryland.gov/api/v3/views/${DATASET_ID}/query.json`;
const CACHE_HEADER = "s-maxage=1800, stale-while-revalidate=86400";
const DETAIL_SOURCE_LIMIT = 1200;
const SOURCE_METADATA = {
  state: "MD",
  sourceType: "Budget funding sources",
  sourceLabel: "Maryland Operating Budget - Funding Source",
  sourceUrl:
    "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-Funding-Source/gy87-e27x",
  sourcePageUrl: "http://dbm.maryland.gov/budget/Pages/operbudhome.aspx",
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data funding-source dataset attributed to the Maryland Department of Budget and Management.",
  coverage:
    "This view uses operating-budget funding-source rows by fiscal year, agency, unit, program, fund type, fund source code, fund source name, category, description, and budget amount.",
  dataLastUpdated: "February 9, 2026",
  metadataUpdated: "May 13, 2026",
  updateFrequency: "Annual/periodic source updates",
  limitations: [
    "Funding-source rows explain where operating-budget money comes from; they are not transaction-level payments.",
    "This dataset does not include the operating-budget stage/type field, so budget-stage comparisons should use the main operating-budget source.",
    "The dataset description states DBM and DoIT do not guarantee full accuracy or completeness, and the data can change as DBM updates source data.",
  ],
  knownExclusions: [
    "Vendor-payment transactions",
    "Capital-project authorizations",
    "Budget-stage/type labels",
    "Local government and local school district ledgers",
    "Audited fund-to-payment reconciliation keys",
  ],
  supportedQuestions: [
    "General Fund, Special Fund, Federal Fund, and other fund-type mix by fiscal year",
    "Largest fund sources by code and name",
    "Agency and program funding-source summaries",
    "Category-level fund-source context",
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
      "Maryland's funding-source API did not return data.";
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

function soqlQuote(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[%_]/g, "");
}

function buildFundingWhere({
  fiscalYear,
  search,
  fundType,
  fundSource,
  agency,
  category,
}) {
  const clauses = [`fiscal_year=${fiscalYear}`, "budget > 0"];
  const cleanSearch = normalizeSearchText(search);

  if (cleanSearch) {
    const pattern = soqlQuote(`%${cleanSearch}%`);
    clauses.push(
      "(upper(agency_name) LIKE " +
        pattern +
        " OR upper(unit_name) LIKE " +
        pattern +
        " OR upper(program_name) LIKE " +
        pattern +
        " OR upper(fund_type_name) LIKE " +
        pattern +
        " OR upper(fund_source_name) LIKE " +
        pattern +
        " OR upper(fund_source_code) LIKE " +
        pattern +
        " OR upper(category_title) LIKE " +
        pattern +
        " OR upper(description) LIKE " +
        pattern +
        ")"
    );
  }

  if (fundType && fundType !== "all") {
    clauses.push(`fund_type_name=${soqlQuote(fundType)}`);
  }

  if (fundSource && fundSource !== "all") {
    clauses.push(`fund_source_name=${soqlQuote(fundSource)}`);
  }

  if (agency && agency !== "all") {
    clauses.push(`agency_name=${soqlQuote(agency)}`);
  }

  if (category && category !== "all") {
    clauses.push(`category_title=${soqlQuote(category)}`);
  }

  return clauses.join(" AND ");
}

function normalizeFundingYears(rows) {
  return rows
    .map((row) => ({
      fiscalYear: cleanNumber(row.fiscal_year),
      totalAmount: cleanNumber(row.total_amount),
      rowCount: cleanNumber(row.row_count),
      sourceLabel: SOURCE_METADATA.sourceLabel,
      sourceUrl: SOURCE_METADATA.sourceUrl,
    }))
    .filter((row) => row.fiscalYear > 0 && row.totalAmount > 0)
    .sort((a, b) => b.fiscalYear - a.fiscalYear);
}

function normalizeNamedTotal(row, nameField, fallback, totalAmount) {
  const dollarAmount = cleanNumber(row.dollar_amount);

  return {
    name: cleanText(row[nameField], fallback),
    dollarAmount,
    rowCount: cleanNumber(row.row_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

function normalizeFundSourceTotal(row, totalAmount) {
  const dollarAmount = cleanNumber(row.dollar_amount);
  const fundSourceName = cleanText(row.fund_source_name, "Unknown fund source");
  const fundSourceCode = cleanText(row.fund_source_code, "No source code");

  return {
    name: `${fundSourceName} (${fundSourceCode})`,
    fundSourceName,
    fundSourceCode,
    fundType: cleanText(row.fund_type_name, "Unknown fund type"),
    dollarAmount,
    rowCount: cleanNumber(row.row_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

function normalizeProgramTotal(row, totalAmount) {
  const dollarAmount = cleanNumber(row.dollar_amount);

  return {
    name: cleanText(row.program_name, "Unknown program"),
    agencyName: cleanText(row.agency_name, "Unknown agency"),
    dollarAmount,
    rowCount: cleanNumber(row.row_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

function normalizeFundingRow(row, totalAmount, fiscalYear) {
  const dollarAmount = cleanNumber(row.dollar_amount);

  return {
    fiscalYear,
    agencyName: cleanText(row.agency_name, "Unknown agency"),
    agencyCode: cleanText(row.agency_code, "No agency code"),
    unitName: cleanText(row.unit_name, "Unknown unit"),
    unitCode: cleanText(row.unit_code, "No unit code"),
    programName: cleanText(row.program_name, "Unknown program"),
    programCode: cleanText(row.program_code, "No program code"),
    fundType: cleanText(row.fund_type_name, "Unknown fund type"),
    fundSourceCode: cleanText(row.fund_source_code, "No source code"),
    fundSourceName: cleanText(row.fund_source_name, "Unknown fund source"),
    categoryTitle: cleanText(row.category_title, "Uncategorized"),
    description: cleanText(row.description, "No description listed"),
    dollarAmount,
    rowCount: cleanNumber(row.row_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
    sourceLabel: SOURCE_METADATA.sourceLabel,
    sourceUrl: SOURCE_METADATA.sourceUrl,
    confidence: SOURCE_METADATA.confidence,
    notes: SOURCE_METADATA.sourceType,
  };
}

function findFundTypeAmount(fundTypes, matcher) {
  const row = fundTypes.find((fundType) =>
    matcher(String(fundType.name || "").toLowerCase())
  );
  return row?.dollarAmount || 0;
}

async function getFundingYears() {
  const rows = await fetchSocrataRows(
    "SELECT fiscal_year, sum(budget) as total_amount, count(*) as row_count " +
      "WHERE budget > 0 " +
      "GROUP BY fiscal_year " +
      "ORDER BY fiscal_year DESC " +
      "LIMIT 60",
    60
  );

  return normalizeFundingYears(rows);
}

async function getFundingDetail(filters) {
  const where = buildFundingWhere(filters);

  const [
    summaryRows,
    fundingRows,
    fundTypeRows,
    fundSourceRows,
    agencyRows,
    categoryRows,
    programRows,
  ] = await Promise.all([
    fetchSocrataRows(
      `SELECT sum(budget) as total_amount, count(*) as row_count WHERE ${where}`,
      1
    ),
    fetchSocrataRows(
      "SELECT agency_code, agency_name, unit_code, unit_name, program_code, " +
        "program_name, fund_type_name, fund_source_code, fund_source_name, " +
        "category_title, description, sum(budget) as dollar_amount, " +
        `count(*) as row_count WHERE ${where} ` +
        "GROUP BY agency_code, agency_name, unit_code, unit_name, program_code, " +
        "program_name, fund_type_name, fund_source_code, fund_source_name, " +
        "category_title, description " +
        `ORDER BY sum(budget) DESC LIMIT ${DETAIL_SOURCE_LIMIT}`,
      DETAIL_SOURCE_LIMIT
    ),
    fetchSocrataRows(
      `SELECT fund_type_name, sum(budget) as dollar_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY fund_type_name ORDER BY sum(budget) DESC LIMIT 20",
      20
    ),
    fetchSocrataRows(
      "SELECT fund_type_name, fund_source_code, fund_source_name, " +
        `sum(budget) as dollar_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY fund_type_name, fund_source_code, fund_source_name " +
        "ORDER BY sum(budget) DESC LIMIT 150",
      150
    ),
    fetchSocrataRows(
      `SELECT agency_name, sum(budget) as dollar_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY agency_name ORDER BY sum(budget) DESC LIMIT 120",
      120
    ),
    fetchSocrataRows(
      `SELECT category_title, sum(budget) as dollar_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY category_title ORDER BY sum(budget) DESC LIMIT 40",
      40
    ),
    fetchSocrataRows(
      `SELECT agency_name, program_name, sum(budget) as dollar_amount, count(*) as row_count WHERE ${where} ` +
        "GROUP BY agency_name, program_name ORDER BY sum(budget) DESC LIMIT 60",
      60
    ),
  ]);

  const totalAmount = cleanNumber(summaryRows[0]?.total_amount);
  const rowCount = cleanNumber(summaryRows[0]?.row_count);
  const rows = fundingRows
    .map((row) => normalizeFundingRow(row, totalAmount, filters.fiscalYear))
    .filter((row) => row.dollarAmount > 0);
  const rowTotal = rows.reduce((sum, row) => sum + row.dollarAmount, 0);
  const fundTypes = fundTypeRows
    .map((row) =>
      normalizeNamedTotal(row, "fund_type_name", "Unknown fund type", totalAmount)
    )
    .filter((row) => row.dollarAmount > 0);
  const generalFundTotal = findFundTypeAmount(fundTypes, (name) =>
    name.includes("general")
  );
  const specialFundTotal = findFundTypeAmount(fundTypes, (name) =>
    name.includes("special")
  );
  const federalFundTotal = findFundTypeAmount(fundTypes, (name) =>
    name.includes("federal")
  );

  return {
    fiscalYear: filters.fiscalYear,
    totalAmount,
    rowCount,
    sourceLimit: DETAIL_SOURCE_LIMIT,
    rowTotal,
    rowDifference: Math.max(totalAmount - rowTotal, 0),
    isRowCapped: rows.length >= DETAIL_SOURCE_LIMIT,
    metadata: SOURCE_METADATA,
    fundingRows: rows,
    fundTypes,
    fundSources: fundSourceRows
      .map((row) => normalizeFundSourceTotal(row, totalAmount))
      .filter((row) => row.dollarAmount > 0),
    topAgencies: agencyRows
      .map((row) =>
        normalizeNamedTotal(row, "agency_name", "Unknown agency", totalAmount)
      )
      .filter((row) => row.dollarAmount > 0),
    categories: categoryRows
      .map((row) =>
        normalizeNamedTotal(row, "category_title", "Uncategorized", totalAmount)
      )
      .filter((row) => row.dollarAmount > 0),
    topPrograms: programRows
      .map((row) => normalizeProgramTotal(row, totalAmount))
      .filter((row) => row.dollarAmount > 0),
    generalFundTotal,
    specialFundTotal,
    federalFundTotal,
    generalFundShare: totalAmount > 0 ? (generalFundTotal / totalAmount) * 100 : 0,
    specialFundShare: totalAmount > 0 ? (specialFundTotal / totalAmount) * 100 : 0,
    federalFundShare: totalAmount > 0 ? (federalFundTotal / totalAmount) * 100 : 0,
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
        years: await getFundingYears(),
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
        detail: await getFundingDetail({
          fiscalYear,
          search: url.searchParams.get("q") || "",
          fundType: url.searchParams.get("fundType") || "all",
          fundSource: url.searchParams.get("fundSource") || "all",
          agency: url.searchParams.get("agency") || "all",
          category: url.searchParams.get("category") || "all",
        }),
      });
      return;
    }

    sendJson(response, 400, { error: "Unknown Maryland funding-source API view." });
  } catch (error) {
    sendJson(response, 502, {
      error: error.message || "Could not load Maryland funding-source data.",
    });
  }
}
