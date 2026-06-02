export const SOURCE_LABEL = "Maryland Operating Budget (current)";
export const SOURCE_URL =
  "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-current-/yu65-jmmv";
export const SOURCE_LAST_MODIFIED = "February 11, 2026";
export const SOURCE_METADATA_UPDATED = "February 15, 2026";
export const DEFAULT_SOURCE_METADATA = {
  state: "MD",
  sourceType: "Operating budget",
  sourceLabel: SOURCE_LABEL,
  sourceUrl: SOURCE_URL,
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
      payload?.error || "The Maryland budget API did not return data."
    );
  }

  return payload || {};
}

export async function fetchBudgetYears(signal) {
  const payload = await fetchApi("/api/maryland-budget?view=years", signal);
  return {
    metadata: payload.metadata || DEFAULT_SOURCE_METADATA,
    years: Array.isArray(payload.years) ? payload.years : [],
  };
}

export async function fetchBudgetDetail(fiscalYear, signal) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });
  const payload = await fetchApi(`/api/maryland-budget?${params}`, signal);
  return payload.detail
    ? {
        ...payload.detail,
        metadata: payload.detail.metadata || payload.metadata || DEFAULT_SOURCE_METADATA,
      }
    : null;
}
