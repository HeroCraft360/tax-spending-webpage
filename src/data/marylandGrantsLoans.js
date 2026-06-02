export const GRANTS_LOANS_SOURCE_LABEL =
  "State of Maryland Grant and Loan Data: FY2009 to FY2024";
export const GRANTS_LOANS_SOURCE_URL =
  "https://opendata.maryland.gov/Budget/State-of-Maryland-Grant-and-Loan-Data-FY2009-to-FY/absk-avps";
export const GRANTS_LOANS_PORTAL_URL = "https://grantsandloans.maryland.gov/";
export const GRANTS_LOANS_LAST_UPDATED = "September 9, 2025";
export const GRANTS_LOANS_METADATA_UPDATED = "September 14, 2025";
export const DEFAULT_GRANTS_LOANS_METADATA = {
  state: "MD",
  sourceType: "Grants and loans",
  sourceLabel: GRANTS_LOANS_SOURCE_LABEL,
  sourceUrl: GRANTS_LOANS_SOURCE_URL,
  portalUrl: GRANTS_LOANS_PORTAL_URL,
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data grant and loan dataset published through the Maryland Transparency Portal.",
  coverage:
    "This view uses recipient-level State Aid grant and loan records of $50,000 or more to profit and nonprofit entities by fiscal year, grantor, grantee, ZIP code, category, fiscal period, date, description, and amount.",
  dataLastUpdated: GRANTS_LOANS_LAST_UPDATED,
  metadataUpdated: GRANTS_LOANS_METADATA_UPDATED,
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
      payload?.error || "The Maryland grants-and-loans API did not return data."
    );
  }

  return payload || {};
}

export async function fetchGrantLoanYears(signal) {
  const payload = await fetchApi("/api/maryland-grants-loans?view=years", signal);
  return {
    metadata: payload.metadata || DEFAULT_GRANTS_LOANS_METADATA,
    years: Array.isArray(payload.years) ? payload.years : [],
  };
}

export async function fetchGrantLoanDetail(
  { fiscalYear, searchQuery, grantorFilter, categoryFilter, zipCodeFilter },
  signal
) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });

  if (searchQuery?.trim()) params.set("q", searchQuery.trim());
  if (grantorFilter && grantorFilter !== "all") {
    params.set("grantor", grantorFilter);
  }
  if (categoryFilter && categoryFilter !== "all") {
    params.set("category", categoryFilter);
  }
  if (zipCodeFilter && zipCodeFilter !== "all") {
    params.set("zipCode", zipCodeFilter);
  }

  const payload = await fetchApi(`/api/maryland-grants-loans?${params}`, signal);

  return payload.detail
    ? {
        ...payload.detail,
        metadata:
          payload.detail.metadata ||
          payload.metadata ||
          DEFAULT_GRANTS_LOANS_METADATA,
      }
    : null;
}
