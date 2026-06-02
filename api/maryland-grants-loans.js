const DATASET_ID = "absk-avps";
const QUERY_URL = `https://opendata.maryland.gov/api/v3/views/${DATASET_ID}/query.json`;
const CACHE_HEADER = "s-maxage=1800, stale-while-revalidate=86400";
const DETAIL_AWARD_LIMIT = 1000;
const SOURCE_METADATA = {
  state: "MD",
  sourceType: "Grants and loans",
  sourceLabel: "State of Maryland Grant and Loan Data: FY2009 to FY2024",
  sourceUrl:
    "https://opendata.maryland.gov/Budget/State-of-Maryland-Grant-and-Loan-Data-FY2009-to-FY/absk-avps",
  portalUrl: "https://grantsandloans.maryland.gov/",
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data grant and loan dataset published through the Maryland Transparency Portal.",
  coverage:
    "This view uses recipient-level State Aid grant and loan records of $50,000 or more to profit and nonprofit entities by fiscal year, grantor, grantee, ZIP code, category, fiscal period, date, description, and amount.",
  dataLastUpdated: "September 9, 2025",
  metadataUpdated: "September 14, 2025",
  updateFrequency: "Annual/periodic source updates",
  limitations: [
    "Grant and loan records are assistance payments or awards, not operating-budget allocations or vendor-procurement payment records.",
    "The dataset includes State Aid payments of $50,000 or more to profit and nonprofit entities in a fiscal year.",
    "Grant data begins in fiscal year 2009; loan data begins in fiscal year 2010.",
    "The dataset does not include payments to local or state government and does not include reimbursements to providers in a state program.",
  ],
  knownExclusions: [
    "Awards below the $50,000 reporting threshold",
    "Payments to local or state government",
    "Provider reimbursements in state programs",
    "Operating-budget appropriation intent",
    "Procurement-level vendor-payment detail",
  ],
  supportedQuestions: [
    "Top grant and loan recipients by fiscal year",
    "Grantor-to-recipient assistance summaries",
    "Grant versus loan category totals",
    "ZIP-code and fiscal-period recipient context",
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
      "Maryland's grants-and-loans API did not return data.";
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

function getGrantorAgencyName(grantor) {
  const [agency] = String(grantor || "").split("/");
  return cleanText(agency, "Unknown grantor");
}

function buildAwardWhere({ fiscalYear, search, grantor, category, zipCode }) {
  const clauses = [`fiscalyear=${fiscalYear}`, "amount > 0"];
  const cleanSearch = normalizeSearchText(search);

  if (cleanSearch) {
    const pattern = soqlQuote(`%${cleanSearch}%`);
    clauses.push(
      `(upper(grantor) LIKE ${pattern} OR upper(grantee) LIKE ${pattern} OR upper(description) LIKE ${pattern} OR upper(category) LIKE ${pattern} OR upper(zipcode) LIKE ${pattern})`
    );
  }

  if (grantor && grantor !== "all") {
    clauses.push(`grantor=${soqlQuote(grantor)}`);
  }

  if (category && category !== "all") {
    clauses.push(`category=${soqlQuote(category)}`);
  }

  if (zipCode && zipCode !== "all") {
    clauses.push(`zipcode=${soqlQuote(zipCode)}`);
  }

  return clauses.join(" AND ");
}

function normalizeAwardYears(rows) {
  return rows
    .map((row) => ({
      fiscalYear: cleanNumber(row.fiscalyear),
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

function normalizeAwardRow(row, totalAmount, fiscalYear) {
  const dollarAmount = cleanNumber(row.dollar_amount);
  const grantor = cleanText(row.grantor, "Unknown grantor");

  return {
    fiscalYear,
    grantor,
    agencyName: getGrantorAgencyName(grantor),
    granteeName: cleanText(row.grantee, "Unknown recipient"),
    recipientZip: cleanText(row.zipcode, "No ZIP listed"),
    category: cleanText(row.category, "Uncategorized"),
    description: cleanText(row.description, "No description listed"),
    fiscalPeriod: cleanNumber(row.fiscalperiod),
    date: cleanText(row.date, "No date listed"),
    dollarAmount,
    awardCount: cleanNumber(row.award_count),
    percentage: totalAmount > 0 ? (dollarAmount / totalAmount) * 100 : 0,
    sourceLabel: SOURCE_METADATA.sourceLabel,
    sourceUrl: SOURCE_METADATA.sourceUrl,
    confidence: SOURCE_METADATA.confidence,
    notes: SOURCE_METADATA.sourceType,
  };
}

function groupGrantorAgencies(grantorRows, totalAmount) {
  const grouped = new Map();

  grantorRows.forEach((row) => {
    const total = normalizeNamedTotal(row, "grantor", "Unknown grantor", totalAmount);
    const name = getGrantorAgencyName(total.name);
    const current = grouped.get(name) || {
      name,
      dollarAmount: 0,
      sourceNames: [],
    };

    current.dollarAmount += total.dollarAmount;
    if (!current.sourceNames.includes(total.name)) {
      current.sourceNames.push(total.name);
    }

    grouped.set(name, current);
  });

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      percentage: totalAmount > 0 ? (row.dollarAmount / totalAmount) * 100 : 0,
    }))
    .filter((row) => row.dollarAmount > 0)
    .sort((a, b) => b.dollarAmount - a.dollarAmount);
}

async function getAwardYears() {
  const rows = await fetchSocrataRows(
    "SELECT fiscalyear, sum(amount) as total_amount, count(*) as row_count " +
      "WHERE amount > 0 " +
      "GROUP BY fiscalyear " +
      "ORDER BY fiscalyear DESC " +
      "LIMIT 60",
    60
  );

  return normalizeAwardYears(rows);
}

async function getAwardDetail(filters) {
  const where = buildAwardWhere(filters);

  const [summaryRows, awardRows, grantorRows, recipientRows, categoryRows, zipRows] =
    await Promise.all([
      fetchSocrataRows(
        `SELECT sum(amount) as total_amount, count(*) as row_count WHERE ${where}`,
        1
      ),
      fetchSocrataRows(
        "SELECT grantor, grantee, zipcode, category, description, fiscalperiod, date, " +
          `sum(amount) as dollar_amount, count(*) as award_count WHERE ${where} ` +
          "GROUP BY grantor, grantee, zipcode, category, description, fiscalperiod, date " +
          `ORDER BY sum(amount) DESC LIMIT ${DETAIL_AWARD_LIMIT}`,
        DETAIL_AWARD_LIMIT
      ),
      fetchSocrataRows(
        `SELECT grantor, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY grantor ORDER BY sum(amount) DESC LIMIT 100",
        100
      ),
      fetchSocrataRows(
        `SELECT grantee, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY grantee ORDER BY sum(amount) DESC LIMIT 12",
        12
      ),
      fetchSocrataRows(
        `SELECT category, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY category ORDER BY sum(amount) DESC LIMIT 30",
        30
      ),
      fetchSocrataRows(
        `SELECT zipcode, sum(amount) as dollar_amount WHERE ${where} ` +
          "GROUP BY zipcode ORDER BY sum(amount) DESC LIMIT 80",
        80
      ),
    ]);

  const totalAmount = cleanNumber(summaryRows[0]?.total_amount);
  const rowCount = cleanNumber(summaryRows[0]?.row_count);
  const awards = awardRows
    .map((row) => normalizeAwardRow(row, totalAmount, filters.fiscalYear))
    .filter((row) => row.dollarAmount > 0);
  const awardTotal = awards.reduce((sum, row) => sum + row.dollarAmount, 0);

  return {
    fiscalYear: filters.fiscalYear,
    totalAmount,
    rowCount,
    awardLimit: DETAIL_AWARD_LIMIT,
    awardTotal,
    awardDifference: Math.max(totalAmount - awardTotal, 0),
    isAwardCapped: awards.length >= DETAIL_AWARD_LIMIT,
    metadata: SOURCE_METADATA,
    awards,
    topGrantors: grantorRows
      .map((row) => normalizeNamedTotal(row, "grantor", "Unknown grantor", totalAmount))
      .filter((row) => row.dollarAmount > 0),
    topAgencies: groupGrantorAgencies(grantorRows, totalAmount),
    topRecipients: recipientRows
      .map((row) => normalizeNamedTotal(row, "grantee", "Unknown recipient", totalAmount))
      .filter((row) => row.dollarAmount > 0),
    categories: categoryRows
      .map((row) => normalizeNamedTotal(row, "category", "Uncategorized", totalAmount))
      .filter((row) => row.dollarAmount > 0),
    zipCodes: zipRows
      .map((row) => normalizeNamedTotal(row, "zipcode", "No ZIP listed", totalAmount))
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
        years: await getAwardYears(),
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
        detail: await getAwardDetail({
          fiscalYear,
          search: url.searchParams.get("q") || "",
          grantor: url.searchParams.get("grantor") || "all",
          category: url.searchParams.get("category") || "all",
          zipCode: url.searchParams.get("zipCode") || "all",
        }),
      });
      return;
    }

    sendJson(response, 400, { error: "Unknown Maryland grants-and-loans API view." });
  } catch (error) {
    sendJson(response, 502, {
      error: error.message || "Could not load Maryland grants-and-loans data.",
    });
  }
}
