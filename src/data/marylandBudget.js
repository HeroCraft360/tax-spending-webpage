export const SOURCE_LABEL = "Maryland Operating Budget (current)";
export const SOURCE_URL =
  "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-current-/yu65-jmmv";
export const SOURCE_LAST_MODIFIED = "February 11, 2026";
export const SOURCE_METADATA_UPDATED = "February 15, 2026";

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
  return Array.isArray(payload.years) ? payload.years : [];
}

export async function fetchBudgetDetail(fiscalYear, signal) {
  const params = new URLSearchParams({
    view: "detail",
    fiscalYear: String(fiscalYear),
  });
  const payload = await fetchApi(`/api/maryland-budget?${params}`, signal);
  return payload.detail;
}
