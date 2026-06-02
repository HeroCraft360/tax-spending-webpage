export const VENDOR_PAYMENTS_SOURCE_LABEL =
  "State of Maryland Payments Data: FY2008 to FY2024";
export const VENDOR_PAYMENTS_SOURCE_URL =
  "https://opendata.maryland.gov/Budget/State-of-Maryland-Payments-Data-FY2008-to-FY2024/7syw-q4cy";
export const VENDOR_PAYMENTS_PORTAL_URL = "https://vendorpayments.maryland.gov/";
export const VENDOR_PAYMENTS_LAST_UPDATED = "May 7, 2026";
export const VENDOR_PAYMENTS_METADATA_UPDATED = "April 16, 2026";
export const DEFAULT_VENDOR_PAYMENT_METADATA = {
  state: "MD",
  sourceType: "Vendor payments",
  sourceLabel: VENDOR_PAYMENTS_SOURCE_LABEL,
  sourceUrl: VENDOR_PAYMENTS_SOURCE_URL,
  transparencyPortalUrl: VENDOR_PAYMENTS_PORTAL_URL,
  confidence: "High",
  confidenceReason:
    "Official Maryland Open Data payments dataset provided by the Department of Budget and Management.",
  coverage:
    "This view uses Maryland state payment data by fiscal year, agency, vendor, vendor ZIP, amount, fiscal period, date, and category.",
  dataLastUpdated: VENDOR_PAYMENTS_LAST_UPDATED,
  metadataUpdated: VENDOR_PAYMENTS_METADATA_UPDATED,
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
      payload?.error || "The Maryland vendor-payment API did not return data."
    );
  }

  return payload || {};
}

export async function fetchVendorPaymentYears(signal) {
  const payload = await fetchApi("/api/maryland-vendor-payments?view=years", signal);
  return {
    metadata: payload.metadata || DEFAULT_VENDOR_PAYMENT_METADATA,
    years: Array.isArray(payload.years) ? payload.years : [],
  };
}

export async function fetchVendorPaymentDetail(
  { fiscalYear, searchQuery, agencyFilter, categoryFilter },
  signal
) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });

  if (searchQuery?.trim()) params.set("q", searchQuery.trim());
  if (agencyFilter && agencyFilter !== "all") params.set("agency", agencyFilter);
  if (categoryFilter && categoryFilter !== "all") {
    params.set("category", categoryFilter);
  }

  const payload = await fetchApi(`/api/maryland-vendor-payments?${params}`, signal);

  return payload.detail
    ? {
        ...payload.detail,
        metadata:
          payload.detail.metadata ||
          payload.metadata ||
          DEFAULT_VENDOR_PAYMENT_METADATA,
      }
    : null;
}
