export const CAPITAL_PROJECTS_SOURCE_LABEL = "FY 2027 Capital Budget as Enacted";
export const CAPITAL_PROJECTS_SOURCE_URL =
  "https://dbm.maryland.gov/budget/Documents/Capital%20Budget/FY%202027%20Documents/FY2027-Capital-Budget-as-Enacted.pdf";
export const CAPITAL_PROJECTS_PAGE_URL =
  "https://dbm.maryland.gov/budget/Pages/capbudhome.aspx";
export const CAPITAL_PROJECTS_LAST_UPDATED = "FY 2027 enacted budget";
export const CAPITAL_PROJECTS_METADATA_UPDATED = "DBM capital budget page";
export const DEFAULT_CAPITAL_PROJECT_METADATA = {
  state: "MD",
  sourceType: "Capital projects",
  sourceLabel: CAPITAL_PROJECTS_SOURCE_LABEL,
  sourceUrl: CAPITAL_PROJECTS_SOURCE_URL,
  sourcePageUrl: CAPITAL_PROJECTS_PAGE_URL,
  confidence: "High",
  confidenceReason:
    "Official Maryland Department of Budget and Management capital-budget document.",
  coverage:
    "This view normalizes FY 2027 enacted capital-budget detail rows, selected program project-list rows, agency, county, fund type, and authorization amount from the official DBM capital-budget PDF.",
  dataLastUpdated: CAPITAL_PROJECTS_LAST_UPDATED,
  metadataUpdated: CAPITAL_PROJECTS_METADATA_UPDATED,
  updateFrequency: "Annual budget cycle",
  officialTotalAmount: 2713432146,
  limitations: [
    "Capital-budget rows are authorizations for long-lived projects and programs, not operating-budget allocations or vendor payments.",
    "Rows are normalized from the official PDF; some rows are program-level records when the PDF does not publish full project lists.",
  ],
  knownExclusions: [
    "Full DHCD project lists not included in the source PDF at publication",
    "Full Interagency Commission on School Construction project lists not included in the source PDF at publication",
    "Detailed MDOT Consolidated Transportation Program project records",
    "Payment-level and procurement-level records",
  ],
  supportedQuestions: [
    "Top FY 2027 capital projects and programs",
    "Capital authorization by agency, county, category, and fund type",
    "Program-level versus project-list capital records",
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
      payload?.error || "The Maryland capital-project API did not return data."
    );
  }

  return payload || {};
}

export async function fetchCapitalProjectYears(signal) {
  const payload = await fetchApi("/api/maryland-capital-projects?view=years", signal);
  return {
    metadata: payload.metadata || DEFAULT_CAPITAL_PROJECT_METADATA,
    years: Array.isArray(payload.years) ? payload.years : [],
  };
}

export async function fetchCapitalProjectDetail(
  {
    fiscalYear,
    searchQuery,
    agencyFilter,
    countyFilter,
    categoryFilter,
    fundTypeFilter,
    projectTypeFilter,
  },
  signal
) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });

  if (searchQuery?.trim()) params.set("q", searchQuery.trim());
  if (agencyFilter && agencyFilter !== "all") params.set("agency", agencyFilter);
  if (countyFilter && countyFilter !== "all") params.set("county", countyFilter);
  if (categoryFilter && categoryFilter !== "all") {
    params.set("category", categoryFilter);
  }
  if (fundTypeFilter && fundTypeFilter !== "all") {
    params.set("fundType", fundTypeFilter);
  }
  if (projectTypeFilter && projectTypeFilter !== "all") {
    params.set("projectType", projectTypeFilter);
  }

  const payload = await fetchApi(`/api/maryland-capital-projects?${params}`, signal);

  return payload.detail
    ? {
        ...payload.detail,
        metadata:
          payload.detail.metadata ||
          payload.metadata ||
          DEFAULT_CAPITAL_PROJECT_METADATA,
      }
    : null;
}
