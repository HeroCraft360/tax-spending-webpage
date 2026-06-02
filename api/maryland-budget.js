const DATASET_ID = "yu65-jmmv";
const QUERY_URL = `https://opendata.maryland.gov/api/v3/views/${DATASET_ID}/query.json`;
const CACHE_HEADER = "s-maxage=1800, stale-while-revalidate=86400";

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

function normalizeBudgetYear(row) {
  return {
    fiscalYear: cleanNumber(row.fiscal_year),
    totalAmount: cleanNumber(row.total_amount),
    rowCount: cleanNumber(row.row_count),
  };
}

function normalizeAllocationRow(row, totalAmount) {
  const dollarAmount = getAmount(row);

  return {
    agencyName: cleanText(row.agency_name, "Unknown agency"),
    unitName: cleanText(row.unit_name, "Unknown unit"),
    programName: cleanText(row.program_name, "Uncategorized program"),
    fundType: cleanText(row.fund_type_name, "Unknown fund type"),
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
    "SELECT fiscal_year, sum(budget) as total_amount, count(*) as row_count " +
      "WHERE budget > 0 " +
      "GROUP BY fiscal_year " +
      "ORDER BY fiscal_year DESC " +
      "LIMIT 12",
    12
  );

  return rows
    .map(normalizeBudgetYear)
    .filter((row) => row.fiscalYear > 0 && row.totalAmount > 0);
}

async function getBudgetDetail(fiscalYear) {
  const where = positiveBudgetWhere(fiscalYear);

  const [summaryRows, allocationRows, agencyRows, fundRows] = await Promise.all([
    fetchSocrataRows(
      `SELECT sum(budget) as total_amount, count(*) as row_count WHERE ${where}`,
      1
    ),
    fetchSocrataRows(
      "SELECT agency_name, unit_name, program_name, fund_type_name, " +
        `sum(budget) as dollar_amount WHERE ${where} ` +
        "GROUP BY agency_name, unit_name, program_name, fund_type_name " +
        "ORDER BY sum(budget) DESC LIMIT 5000",
      5000
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

  const totalAmount = cleanNumber(summaryRows[0]?.total_amount);
  const rowCount = cleanNumber(summaryRows[0]?.row_count);
  const allocations = allocationRows
    .map((row) => normalizeAllocationRow(row, totalAmount))
    .filter((row) => row.dollarAmount > 0);

  return {
    fiscalYear,
    totalAmount,
    rowCount,
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
      sendJson(response, 200, { years: await getBudgetYears() });
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
