const DATASET_ID = "7syw-q4cy";
const QUERY_URL = `https://opendata.maryland.gov/api/v3/views/${DATASET_ID}/query.json`;
const CACHE_HEADER = "s-maxage=1800, stale-while-revalidate=86400";
const DETAIL_PAYMENT_LIMIT = 1000;
const SOURCE_METADATA = {
  state: "MD",
  sourceType: "Vendor payments",
  sourceLabel: "State of Maryland Payments Data: FY2008 to FY2024",
  sourceUrl:
    "https://opendata.maryland.gov/Budget/State-of-Maryland-Payments-Data-FY2008-to-FY2024/7syw-q4cy",
  transparencyPortalUrl: "https://vendorpayments.maryland.gov/",
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data payments dataset provided by the Department of Budget and Management.",
  coverage:
    "This view uses Maryland state payment data by fiscal year, agency, vendor, vendor ZIP, amount, fiscal period, date, and category.",
  dataLastUpdated: "May 7, 2026",
  metadataUpdated: "April 16, 2026",
  updateFrequency: "Monthly",
  limitations: [
    "Vendor payments are transaction/payment data, not operating-budget allocations.",
    "Current-year values are updated monthly and may be partial.",
    "The public vendor-payment portal notes exclusions for Maryland Judiciary, Legislative Branch, University System of Maryland, Morgan State University, and St. Mary's College payments.",
    "Confidential payments and some individual payee details may not be disclosed.",
  ],
  knownExclusions: [
    "Operating-budget intent or appropriation stage",
    "Excluded branches and institutions named by the vendor-payment portal",
    "Confidential payments",
    "Some individual payee details",
  ],
  supportedQuestions: [
    "Top vendors by fiscal year",
    "Agency-to-vendor payment summaries",
    "Vendor payment category and ZIP context",
    "Monthly-updated current-year payment totals",
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
      "Maryland's vendor-payment API did not return data.";
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

function buildPaymentWhere({ fiscalYear, search, agency, category }) {
  const clauses = [`fiscal_year=${fiscalYear}`, "amount > 0"];
  const cleanSearch = normalizeSearchText(search);

  if (cleanSearch) {
    const pattern = soqlQuote(`%${cleanSearch}%`);
    clauses.push(
      `(upper(vendor_name) LIKE ${pattern} OR upper(agency_name) LIKE ${pattern} OR upper(category) LIKE ${pattern})`
    );
  }

  if (agency && agency !== "all") {
    clauses.push(`agency_name=${soqlQuote(agency)}`);
  }

  if (category && category !== "all") {
    clauses.push(`category=${soqlQuote(category)}`);
  }

  return clauses.join(" AND ");
}

function normalizePaymentYears(rows) {
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
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
  };
}

function normalizePaymentRow(row, totalAmount, fiscalYear) {
  const dollarAmount = cleanNumber(row.dollar_amount);

  return {
    fiscalYear,
    agencyName: cleanText(row.agency_name, "Unknown agency"),
    vendorName: cleanText(row.vendor_name, "Unknown vendor"),
    vendorZip: cleanText(row.vendor_zip, "No ZIP listed"),
    category: cleanText(row.category, "Uncategorized"),
    dollarAmount,
    paymentCount: cleanNumber(row.payment_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
    sourceLabel: SOURCE_METADATA.sourceLabel,
    sourceUrl: SOURCE_METADATA.sourceUrl,
    confidence: SOURCE_METADATA.confidence,
    notes: SOURCE_METADATA.sourceType,
  };
}

async function getPaymentYears() {
  const rows = await fetchSocrataRows(
    "SELECT fiscal_year, sum(amount) as total_amount, count(*) as row_count " +
      "WHERE amount > 0 " +
      "GROUP BY fiscal_year " +
      "ORDER BY fiscal_year DESC " +
      "LIMIT 60",
    60
  );

  return normalizePaymentYears(rows);
}

async function getPaymentDetail(filters) {
  const where = buildPaymentWhere(filters);

  const [summaryRows, paymentRows, agencyRows, vendorRows, categoryRows] =
    await Promise.all([
      fetchSocrataRows(
        `SELECT sum(amount) as total_amount, count(*) as row_count WHERE ${where}`,
        1
      ),
      fetchSocrataRows(
        "SELECT agency_name, vendor_name, vendor_zip, category, " +
          `sum(amount) as dollar_amount, count(*) as payment_count WHERE ${where} ` +
          "GROUP BY agency_name, vendor_name, vendor_zip, category " +
          `ORDER BY sum(amount) DESC LIMIT ${DETAIL_PAYMENT_LIMIT}`,
        DETAIL_PAYMENT_LIMIT
      ),
      fetchSocrataRows(
        `SELECT agency_name, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY agency_name ORDER BY sum(amount) DESC LIMIT 100",
        100
      ),
      fetchSocrataRows(
        `SELECT vendor_name, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY vendor_name ORDER BY sum(amount) DESC LIMIT 12",
        12
      ),
      fetchSocrataRows(
        `SELECT category, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY category ORDER BY sum(amount) DESC LIMIT 80",
        80
      ),
    ]);

  const totalAmount = cleanNumber(summaryRows[0]?.total_amount);
  const rowCount = cleanNumber(summaryRows[0]?.row_count);
  const payments = paymentRows
    .map((row) => normalizePaymentRow(row, totalAmount, filters.fiscalYear))
    .filter((row) => row.dollarAmount > 0);
  const paymentTotal = payments.reduce((sum, row) => sum + row.dollarAmount, 0);

  return {
    fiscalYear: filters.fiscalYear,
    totalAmount,
    rowCount,
    paymentLimit: DETAIL_PAYMENT_LIMIT,
    paymentTotal,
    paymentDifference: Math.max(totalAmount - paymentTotal, 0),
    isPaymentCapped: payments.length >= DETAIL_PAYMENT_LIMIT,
    metadata: SOURCE_METADATA,
    payments,
    topAgencies: agencyRows
      .map((row) =>
        normalizeNamedTotal(row, "agency_name", "Unknown agency", totalAmount)
      )
      .filter((row) => row.dollarAmount > 0),
    topVendors: vendorRows
      .map((row) =>
        normalizeNamedTotal(row, "vendor_name", "Unknown vendor", totalAmount)
      )
      .filter((row) => row.dollarAmount > 0),
    categories: categoryRows
      .map((row) =>
        normalizeNamedTotal(row, "category", "Uncategorized", totalAmount)
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
        years: await getPaymentYears(),
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
        detail: await getPaymentDetail({
          fiscalYear,
          search: url.searchParams.get("q") || "",
          agency: url.searchParams.get("agency") || "all",
          category: url.searchParams.get("category") || "all",
        }),
      });
      return;
    }

    sendJson(response, 400, { error: "Unknown Maryland vendor-payment API view." });
  } catch (error) {
    sendJson(response, 502, {
      error: error.message || "Could not load Maryland vendor-payment data.",
    });
  }
}
