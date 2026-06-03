export const FUNDING_SOURCE_LABEL = "Maryland Operating Budget - Funding Source";
export const FUNDING_SOURCE_URL =
  "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-Funding-Source/gy87-e27x";
export const FUNDING_SOURCE_PAGE_URL =
  "http://dbm.maryland.gov/budget/Pages/operbudhome.aspx";
export const FUNDING_SOURCE_LAST_UPDATED = "February 9, 2026";
export const FUNDING_SOURCE_METADATA_UPDATED = "May 13, 2026";
export const DEFAULT_FUNDING_SOURCE_METADATA = {
  state: "MD",
  sourceType: "Budget funding sources",
  sourceLabel: FUNDING_SOURCE_LABEL,
  sourceUrl: FUNDING_SOURCE_URL,
  sourcePageUrl: FUNDING_SOURCE_PAGE_URL,
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data funding-source dataset attributed to the Maryland Department of Budget and Management.",
  coverage:
    "This view uses operating-budget funding-source rows by fiscal year, agency, unit, program, fund type, fund source code, fund source name, category, description, and budget amount.",
  dataLastUpdated: FUNDING_SOURCE_LAST_UPDATED,
  metadataUpdated: FUNDING_SOURCE_METADATA_UPDATED,
  updateFrequency: "Annual/periodic source updates",
  limitations: [
    "Funding-source rows explain where operating-budget money comes from; they are not transaction-level payments.",
    "This dataset does not include the operating-budget stage/type field, so budget-stage comparisons should use the main operating-budget source.",
    "Funding-source totals can differ from the current operating-budget source when datasets update on different cycles.",
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

async function fetchApi(path, signal) {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || "The Maryland funding-source API did not return data."
    );
  }

  return payload || {};
}

export async function fetchFundingSourceYears(signal) {
  const payload = await fetchApi("/api/maryland-funding-sources?view=years", signal);
  return {
    metadata: payload.metadata || DEFAULT_FUNDING_SOURCE_METADATA,
    years: Array.isArray(payload.years) ? payload.years : [],
  };
}

export async function fetchFundingSourceDetail(
  {
    fiscalYear,
    searchQuery,
    fundTypeFilter,
    fundSourceFilter,
    agencyFilter,
    categoryFilter,
  },
  signal
) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });

  if (searchQuery?.trim()) params.set("q", searchQuery.trim());
  if (fundTypeFilter && fundTypeFilter !== "all") {
    params.set("fundType", fundTypeFilter);
  }
  if (fundSourceFilter && fundSourceFilter !== "all") {
    params.set("fundSource", fundSourceFilter);
  }
  if (agencyFilter && agencyFilter !== "all") {
    params.set("agency", agencyFilter);
  }
  if (categoryFilter && categoryFilter !== "all") {
    params.set("category", categoryFilter);
  }

  const payload = await fetchApi(`/api/maryland-funding-sources?${params}`, signal);

  return payload.detail
    ? {
        ...payload.detail,
        metadata:
          payload.detail.metadata ||
          payload.metadata ||
          DEFAULT_FUNDING_SOURCE_METADATA,
      }
    : null;
}
