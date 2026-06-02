export const BUDGET_COVERAGE_SOURCES = [
  {
    id: "operating-budget",
    label: "Operating budget allocations",
    status: "Live",
    adapter: "Connected",
    confidence: "High",
    coverageScore: 92,
    phase: "Phase 3A live",
    availability: "Current Maryland operating-budget open data.",
    adds: "Agency, department, program, subprogram, category, fund type, fiscal year, amount, and budget stage.",
    sourceLabel: "Maryland Operating Budget (current)",
    sourceUrl:
      "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-current-/yu65-jmmv",
    adapterTasks: [
      "Keep the Socrata operating-budget query normalized into the app row model.",
      "Use fiscal year, budget stage, agency, program, category, and fund type as stable dimensions.",
      "Show allocation totals separately from payment and capital-project records.",
    ],
    reconciliationKeys: [
      "fiscal_year",
      "agency_name",
      "unit_name",
      "program_name",
      "fund_type_name",
    ],
    limitations: [
      "Allocation data, not every tax-dollar transaction.",
      "Does not replace vendor-payment or capital-project datasets.",
    ],
  },
  {
    id: "budget-funding-sources",
    label: "Budget funding sources",
    status: "Source identified",
    adapter: "Planned adapter",
    confidence: "High",
    coverageScore: 68,
    phase: "Phase 3B adapter queue",
    availability: "Maryland Transparency Portal operating-budget funding-source views.",
    adds: "A clearer general fund, special fund, federal fund, and other-fund funding picture.",
    sourceLabel: "Maryland Transparency Portal",
    sourceUrl: "https://mtp.maryland.gov/",
    adapterTasks: [
      "Identify the public endpoint or export path for fund-source views.",
      "Normalize fund names to the operating-budget fund type vocabulary.",
      "Flag totals that come from portal summaries instead of row-level allocations.",
    ],
    reconciliationKeys: ["fiscal_year", "fund_source", "agency_or_program"],
    limitations: [
      "Needs a normalized API adapter before table-level comparison is available in this app.",
    ],
  },
  {
    id: "vendor-payments",
    label: "Vendor payments",
    status: "Live",
    adapter: "Connected",
    confidence: "High",
    coverageScore: 86,
    phase: "Phase 3B live",
    availability: "Official Maryland Open Data payment records are updated monthly and cover fiscal years beginning in 2008.",
    adds: "Agency-to-vendor payment summaries by fiscal year, vendor, category, vendor ZIP, payment amount, and source row count.",
    sourceLabel: "State of Maryland Payments Data: FY2008 to FY2024",
    sourceUrl:
      "https://opendata.maryland.gov/Budget/State-of-Maryland-Payments-Data-FY2008-to-FY2024/7syw-q4cy",
    secondaryUrl: "https://vendorpayments.maryland.gov/",
    secondaryLabel: "Maryland Vendor Payments portal",
    adapterTasks: [
      "Keep vendor name, agency, fiscal year, payment total, category, ZIP, and row count normalized.",
      "Preserve portal exclusions beside every vendor-payment view.",
      "Keep vendor payments out of allocation totals unless a reconciliation view explicitly joins them.",
    ],
    reconciliationKeys: ["fiscal_year", "agency", "vendor_name"],
    limitations: [
      "The portal excludes Maryland Judiciary, Legislative Branch, University System of Maryland, Morgan State University, and St. Mary's College payments.",
      "Confidential payments and some individual payee data are not disclosed.",
    ],
  },
  {
    id: "grants-loans",
    label: "State grants and loans",
    status: "Source identified",
    adapter: "Planned adapter",
    confidence: "High",
    coverageScore: 61,
    phase: "Phase 3B adapter queue",
    availability: "Grant data begins in fiscal year 2009; loan data begins in fiscal year 2010.",
    adds: "Recipient-level grant and loan payments of at least $50,000 to profit and nonprofit entities.",
    sourceLabel: "State of Maryland Grants and Loans",
    sourceUrl: "https://grantsandloans.maryland.gov/",
    adapterTasks: [
      "Normalize recipient, agency, assistance type, fiscal year, and award amount.",
      "Separate grants from loans before comparing totals.",
      "Expose threshold and recipient-type exclusions in the trace drawer.",
    ],
    reconciliationKeys: ["fiscal_year", "agency", "recipient", "assistance_type"],
    limitations: [
      "Does not include payments to local or state government.",
      "Does not include reimbursements to providers in a state program.",
    ],
  },
  {
    id: "capital-budget",
    label: "Capital budget and projects",
    status: "Live",
    adapter: "Connected PDF adapter",
    confidence: "High",
    coverageScore: 78,
    phase: "Phase 3B live",
    availability: "FY 2027 enacted capital-budget detail is normalized from DBM's official capital-budget PDF.",
    adds: "Agency, project/program title, county, category, fund type, source-page context, enacted stage, and authorization amount.",
    sourceLabel: "FY 2027 Capital Budget as Enacted",
    sourceUrl:
      "https://dbm.maryland.gov/budget/Documents/Capital%20Budget/FY%202027%20Documents/FY2027-Capital-Budget-as-Enacted.pdf",
    secondaryUrl: "https://dbm.maryland.gov/budget/Pages/capbudhome.aspx",
    secondaryLabel: "Maryland DBM capital budget page",
    adapterTasks: [
      "Keep PDF-derived project/program rows separate from operating allocations and vendor payments.",
      "Add DHCD and school-construction project lists when DBM publishes full project lists.",
      "Reconcile capital projects by agency and geography, not by operating-budget program alone.",
    ],
    reconciliationKeys: ["fiscal_year", "agency", "project_title", "county"],
    limitations: [
      "Some rows are program-level records where the official PDF does not publish full project lists.",
      "The source PDF says DHCD and Interagency Commission on School Construction project lists will be added when available.",
      "Detailed MDOT CTP project records are not included in this capital-budget PDF adapter.",
    ],
  },
  {
    id: "local-education-spending",
    label: "Local education spending",
    status: "External source needed",
    adapter: "Not connected",
    confidence: "Medium",
    coverageScore: 44,
    phase: "Phase 3C local layer",
    availability: "Often published by local school systems, counties, and state report-card downloads.",
    adds: "District-level school spending that is not fully represented by state operating-budget allocations.",
    sourceLabel: "Maryland Report Card and local school system finance sources",
    sourceUrl: "https://reportcard.msde.maryland.gov/",
    adapterTasks: [
      "Collect district finance and outcome downloads from Maryland Report Card where available.",
      "Map county and school-system names to a stable local geography list.",
      "Show state aid, local revenue, and local expenditure as distinct values.",
    ],
    reconciliationKeys: ["school_year", "county", "school_system", "funding_type"],
    limitations: [
      "Requires local-source normalization before statewide comparisons are reliable.",
    ],
  },
];

export const CAPITAL_PROJECT_PIPELINE = [
  {
    label: "Project identity",
    status: "Connected",
    detail: "FY 2027 project/program title, agency owner, county, category, and source-page context are normalized from the official DBM PDF.",
  },
  {
    label: "Funding authority",
    status: "Connected",
    detail: "The capital view keeps enacted capital authorizations and deauthorizations separate from operating allocations and vendor payments.",
  },
  {
    label: "Operating link",
    status: "Planned",
    detail: "Capital projects can be compared with operating agencies, but they should not be merged into operating totals.",
  },
];

export const LOCAL_LAYER_SOURCES = [
  {
    label: "Maryland Report Card",
    status: "Source identified",
    detail: "Statewide school-system outcomes and report-card downloads can anchor district comparisons.",
  },
  {
    label: "County and school-system finance",
    status: "External source needed",
    detail: "Local budget documents are needed for district-level expenditure views beyond state aid.",
  },
  {
    label: "State education aid",
    status: "Planned",
    detail: "State aid should be shown as a bridge between state operating allocations and local education budgets.",
  },
];

export const COVERAGE_IMPLEMENTATION_STEPS = [
  {
    phase: "Phase 3A",
    label: "Normalize source registry",
    status: "Added",
    detail: "The app now names each official source, adapter status, confidence, exclusion, coverage score, and reconciliation keys.",
    tasks: [
      "Operating-budget row model",
      "Source confidence labels",
      "Coverage scores",
      "Traceable source links",
    ],
  },
  {
    phase: "Phase 3B",
    label: "Add live adapters",
    status: "In progress",
    detail: "Vendor payments and FY 2027 capital projects are live; grants/loans and funding sources still have adapter task cards and honest source status.",
    tasks: [
      "Vendor-payment adapter connected",
      "Capital-project PDF adapter connected",
      "Grants and loans adapter plan",
      "Funding-source adapter plan",
    ],
  },
  {
    phase: "Phase 3C",
    label: "Cross-source reconciliation",
    status: "Next",
    detail: "After adapters exist, the app can compare allocations, actuals, payments, outcomes, and project records without mixing definitions.",
    tasks: [
      "Shared fiscal-year keys",
      "Agency and geography matching",
      "Definition warnings",
      "Outcome and local layer joins",
    ],
  },
];
