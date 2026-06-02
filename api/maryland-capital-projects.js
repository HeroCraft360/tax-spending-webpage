const CACHE_HEADER = "s-maxage=3600, stale-while-revalidate=86400";
const FY_2027 = 2027;
const DETAIL_PROJECT_LIMIT = 1000;
const SOURCE_METADATA = {
  state: "MD",
  sourceType: "Capital projects",
  sourceLabel: "FY 2027 Capital Budget as Enacted",
  sourceUrl:
    "https://dbm.maryland.gov/budget/Documents/Capital%20Budget/FY%202027%20Documents/FY2027-Capital-Budget-as-Enacted.pdf",
  sourcePageUrl: "https://dbm.maryland.gov/budget/Pages/capbudhome.aspx",
  secondaryUrl: "https://dls.maryland.gov/budget/capital/",
  secondaryLabel: "Department of Legislative Services capital resources",
  confidence: "High",
  confidenceReason:
    "Official Maryland Department of Budget and Management capital-budget document.",
  coverage:
    "This view normalizes FY 2027 enacted capital-budget detail rows, selected program project-list rows, agency, county, fund type, and authorization amount from the official DBM capital-budget PDF.",
  dataLastUpdated: "FY 2027 enacted budget",
  metadataUpdated: "DBM capital budget page",
  updateFrequency: "Annual budget cycle",
  officialTotalAmount: 2713432146,
  authorizedBeforeDeauthorizations: 2832975847,
  deauthorizations: 119543701,
  limitations: [
    "Capital-budget rows are authorizations for long-lived projects and programs, not operating-budget allocations or vendor payments.",
    "Rows are normalized from the official PDF; some rows are program-level records when the PDF does not publish full project lists.",
    "The FY 2027 PDF notes that full project lists for Department of Housing and Community Development and Interagency Commission on School Construction will be added when available.",
    "Transportation is represented by the enacted capital-budget summary row shown in this PDF, not the full MDOT Consolidated Transportation Program project book.",
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
    "Capital-budget source caveats for reconciliation with operating budget and payments",
  ],
};

const FUND_SUMMARY = [
  { name: "GO Bonds", dollarAmount: 1755000000 },
  { name: "General Funds", dollarAmount: 107719665 },
  { name: "Special Funds", dollarAmount: 545501801 },
  { name: "Federal Funds", dollarAmount: 255210680 },
  { name: "Revenue Bonds", dollarAmount: 50000000 },
];

const CAPITAL_PROJECTS = [
  {
    agencyName: "Interagency Commission on School Construction",
    projectTitle: "Public School Construction Program",
    county: "Statewide",
    category: "Education",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 300000000,
    sourcePage: 4,
  },
  {
    agencyName: "Miscellaneous",
    projectTitle: "Legislative Initiatives",
    county: "Statewide",
    category: "Community Development",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 229867951,
    sourcePage: 8,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Maryland Water Quality Revolving Loan Fund",
    county: "Statewide",
    category: "Health and Environment",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 230554815,
    sourcePage: 2,
  },
  {
    agencyName: "Miscellaneous",
    projectTitle: "Governor Initiatives",
    county: "Statewide",
    category: "Community Development",
    projectType: "Grant program",
    fundType: "Mixed funds",
    dollarAmount: 172045665,
    sourcePage: 7,
  },
  {
    agencyName: "Department of Transportation",
    projectTitle: "Washington Metropolitan Area Transit Authority Upgrades",
    county: "Regional",
    category: "Transportation",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 167000000,
    sourcePage: 8,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Maryland Drinking Water Revolving Loan Fund",
    county: "Statewide",
    category: "Health and Environment",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 165960807,
    sourcePage: 2,
  },
  {
    agencyName: "Morgan State University",
    projectTitle: "New Science Center, Phase II",
    county: "Baltimore City",
    category: "Higher Education",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 106991000,
    sourcePage: 5,
  },
  {
    agencyName: "Department of Natural Resources",
    projectTitle: "Program Open Space",
    county: "Statewide",
    category: "Natural Resources",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 86113991,
    sourcePage: 5,
  },
  {
    agencyName: "Interagency Commission on School Construction",
    projectTitle: "Supplemental Capital Grant Program",
    county: "Statewide",
    category: "Education",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 80000000,
    sourcePage: 4,
  },
  {
    agencyName: "Interagency Commission on School Construction",
    projectTitle: "Nancy K. Kopp Public School Facilities Priority Fund",
    county: "Statewide",
    category: "Education",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 70000000,
    sourcePage: 4,
  },
  {
    agencyName: "Interagency Commission on School Construction",
    projectTitle: "Built to Learn Fund",
    county: "Statewide",
    category: "Education",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 69000000,
    sourcePage: 4,
  },
  {
    agencyName: "Board of Public Works",
    projectTitle: "Facilities Renewal Fund",
    county: "Statewide",
    category: "Government Services",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 63166000,
    sourcePage: 6,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Strategic Demolition Fund",
    county: "Statewide",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 60000000,
    sourcePage: 4,
  },
  {
    agencyName: "Maryland Higher Education Commission",
    projectTitle: "Community College Construction Grant Program",
    county: "Statewide",
    category: "Higher Education",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 56685000,
    sourcePage: 3,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Housing and Building Energy Programs",
    county: "Statewide",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 56500000,
    sourcePage: 3,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Bay Restoration Fund Wastewater Program",
    county: "Statewide",
    category: "Health and Environment",
    projectType: "Program",
    fundType: "Special Funds",
    dollarAmount: 50000000,
    sourcePage: 2,
  },
  {
    agencyName: "University System of Maryland",
    projectTitle: "UMB: New School of Social Work Building",
    county: "Baltimore City",
    category: "Higher Education",
    projectType: "Project",
    fundType: "Mixed funds",
    dollarAmount: 46747000,
    sourcePage: 7,
  },
  {
    agencyName: "University System of Maryland",
    projectTitle: "UMD: New Health and Human Sciences Complex",
    county: "Prince George's",
    category: "Higher Education",
    projectType: "Project",
    fundType: "Mixed funds",
    dollarAmount: 44315000,
    sourcePage: 7,
  },
  {
    agencyName: "Morgan State University",
    projectTitle: "Campuswide Electric Infrastructure Upgrades",
    county: "Baltimore City",
    category: "Higher Education",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 40486000,
    sourcePage: 5,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Rental Housing Programs",
    county: "Statewide",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 37303594,
    sourcePage: 4,
  },
  {
    agencyName: "University System of Maryland",
    projectTitle: "TU: Smith Hall Renovation and Reconstruction",
    county: "Baltimore",
    category: "Higher Education",
    projectType: "Project",
    fundType: "Mixed funds",
    dollarAmount: 35973000,
    sourcePage: 7,
  },
  {
    agencyName: "University of Maryland Medical System",
    projectTitle: "University of Maryland Shore Regional Health - New Easton Regional Medical Center",
    county: "Talbot",
    category: "Health",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 20000000,
    sourcePage: 6,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "National Capital Strategic Economic Development Fund",
    county: "Statewide",
    category: "Economic Development",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 20050000,
    sourcePage: 4,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Baltimore Regional Neighborhood Initiative",
    county: "Baltimore Region",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 21250000,
    sourcePage: 3,
  },
  {
    agencyName: "Miscellaneous",
    projectTitle: "Maryland Hospital Association - Private Hospital Grant Program",
    county: "Statewide",
    category: "Health",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 21550000,
    sourcePage: 8,
  },
  {
    agencyName: "Department of Natural Resources",
    projectTitle: "Natural Resources Development Fund",
    county: "Statewide",
    category: "Natural Resources",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 19381565,
    sourcePage: 5,
  },
  {
    agencyName: "Interagency Commission on School Construction",
    projectTitle: "Public School HVAC Updates - Baltimore City",
    county: "Baltimore City",
    category: "Education",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 18850000,
    sourcePage: 4,
  },
  {
    agencyName: "Department of Information Technology",
    projectTitle: "Maryland FiRST Public Safety Radio System",
    county: "Statewide",
    category: "Public Safety",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 16268000,
    sourcePage: 4,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Septic System Upgrade Program",
    county: "Statewide",
    category: "Health and Environment",
    projectType: "Program",
    fundType: "Special Funds",
    dollarAmount: 15000000,
    sourcePage: 2,
  },
  {
    agencyName: "Miscellaneous",
    projectTitle: "AstraZeneca Facilities Expansion",
    county: "Statewide",
    category: "Economic Development",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 14571000,
    sourcePage: 7,
  },
  {
    agencyName: "Department of Natural Resources",
    projectTitle: "Waterway Improvement Capital Projects",
    county: "Statewide",
    category: "Natural Resources",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 14943156,
    sourcePage: 5,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Comprehensive Flood Management Program",
    county: "Statewide",
    category: "Health and Environment",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 13867000,
    sourcePage: 2,
  },
  {
    agencyName: "Department of Natural Resources",
    projectTitle: "Rural Legacy Program",
    county: "Statewide",
    category: "Natural Resources",
    projectType: "Program",
    fundType: "Special Funds",
    dollarAmount: 13400880,
    sourcePage: 5,
  },
  {
    agencyName: "University System of Maryland",
    projectTitle: "UMD: New Interdisciplinary Engineering Building - Zupnik Hall",
    county: "Prince George's",
    category: "Higher Education",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 13110000,
    sourcePage: 7,
  },
  {
    agencyName: "University System of Maryland",
    projectTitle: "TU: Electrical Substation Expansion and Improvements",
    county: "Baltimore",
    category: "Higher Education",
    projectType: "Project",
    fundType: "Mixed funds",
    dollarAmount: 12820000,
    sourcePage: 7,
  },
  {
    agencyName: "Maryland State Library Agency",
    projectTitle: "Public Library Capital Grant Program",
    county: "Statewide",
    category: "Education",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 12775000,
    sourcePage: 4,
  },
  {
    agencyName: "Department of Health",
    projectTitle: "Renovation of Clifton T. Perkins Hospital North Wing",
    county: "Howard",
    category: "Health",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 12363000,
    sourcePage: 3,
  },
  {
    agencyName: "Department of Natural Resources",
    projectTitle: "Program Open Space - Public Access Program",
    county: "Statewide",
    category: "Natural Resources",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 12000000,
    sourcePage: 5,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Neighborhood Business Development Program",
    county: "Statewide",
    category: "Economic Development",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 12289000,
    sourcePage: 4,
  },
  {
    agencyName: "Baltimore City Community College",
    projectTitle: "Learning Commons Renovation and Addition",
    county: "Baltimore City",
    category: "Higher Education",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 9790000,
    sourcePage: 2,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Special Loan Programs",
    county: "Statewide",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 9440000,
    sourcePage: 4,
  },
  {
    agencyName: "Maryland Independent College and University Association",
    projectTitle: "Private Higher Education Facilities Grant Program",
    county: "Statewide",
    category: "Higher Education",
    projectType: "Grant program",
    fundType: "GO Bonds",
    dollarAmount: 9200000,
    sourcePage: 8,
  },
  {
    agencyName: "Department of Agriculture",
    projectTitle: "Maryland Agricultural Cost-Share Program",
    county: "Statewide",
    category: "Agriculture",
    projectType: "Program",
    fundType: "GO Bonds",
    dollarAmount: 8000000,
    sourcePage: 2,
  },
  {
    agencyName: "Department of Agriculture",
    projectTitle: "Agricultural Land Preservation Program",
    county: "Statewide",
    category: "Agriculture",
    projectType: "Program",
    fundType: "Special Funds",
    dollarAmount: 38726423,
    sourcePage: 2,
  },
  {
    agencyName: "Department of Housing and Community Development",
    projectTitle: "Homeownership Programs",
    county: "Statewide",
    category: "Housing and Community",
    projectType: "Program",
    fundType: "Mixed funds",
    dollarAmount: 25000000,
    sourcePage: 3,
  },
  {
    agencyName: "Board of Public Works",
    projectTitle: "New Supreme Court of Maryland Building",
    county: "Anne Arundel",
    category: "Government Services",
    projectType: "Project",
    fundType: "GO Bonds",
    dollarAmount: 20388000,
    sourcePage: 6,
  },
  {
    agencyName: "Department of Disabilities",
    projectTitle: "Baltimore Co. UMBC: Accessibility Modifications to 8 Biological Sciences Teaching Labs",
    county: "Baltimore",
    category: "Government Services",
    projectType: "Project list",
    fundType: "GO Bonds",
    dollarAmount: 77000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of Disabilities",
    projectTitle: "Garrett DNR: ADA Fishing Access at Deep Creek Lake State Park",
    county: "Garrett",
    category: "Natural Resources",
    projectType: "Project list",
    fundType: "GO Bonds",
    dollarAmount: 95000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of Disabilities",
    projectTitle: "Prince George's UMD: McKeldin Toilet Rooms Renovation",
    county: "Prince George's",
    category: "Higher Education",
    projectType: "Project list",
    fundType: "GO Bonds",
    dollarAmount: 264000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Effluent Filter Rehabilitation at Back River Wastewater Treatment Plant",
    county: "Baltimore City",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 2000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Effluent Filter Rehabilitation at Back River Wastewater Treatment Plant",
    county: "Baltimore",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 2000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Federalsburg Wastewater Treatment Plant Enhanced Nutrient Removal Refinement",
    county: "Caroline",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 2235500,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Greensboro Regional Wastewater System Extension",
    county: "Caroline",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 3047255,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Manchester Wastewater Treatment Plant Upgrade",
    county: "Carroll",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 6085072,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Vienna Wastewater Treatment Plant Enhanced Nutrient Removal Upgrade",
    county: "Dorchester",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 4000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Town of Grantsville Wastewater Treatment Plant Upgrade",
    county: "Garrett",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 7933079,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Centreville Wastewater Treatment Plant Expansion",
    county: "Queen Anne's",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 4500000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Princess Anne Wastewater Treatment Plant Enhanced Nutrient Removal Upgrade",
    county: "Somerset",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 7000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Easton Enhanced Nutrient Removal Wastewater Treatment Facility Upgrades",
    county: "Talbot",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 5000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Trappe Wastewater Treatment Plant Enhanced Nutrient Removal Upgrade",
    county: "Talbot",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 2097046,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Town of Hancock Wastewater Treatment Plant Upgrade",
    county: "Washington",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Special Funds",
    dollarAmount: 4102048,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Middle Branch Resiliency Initiative Stage 2",
    county: "Baltimore City",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 3549000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Wheatley Dam Retrofitting Construction",
    county: "Charles",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 3318000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Ellicott City Maryland Avenue Culverts",
    county: "Howard",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 4000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Prince George's County - Port Towns Watershed Restoration Initiative",
    county: "Prince George's",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 2000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Northern Crisfield Flood Mitigation Project",
    county: "Somerset",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 1000000,
    sourcePage: 9,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Dehaven and Mason Road Project",
    county: "Allegany",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 1725000,
    sourcePage: 10,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Depot Street Water Project",
    county: "Allegany",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 700000,
    sourcePage: 10,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Anne Arundel County Lead Service Line Replacement Program",
    county: "Anne Arundel",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 3100000,
    sourcePage: 10,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Parker Drive Water System Connection",
    county: "Anne Arundel",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 465000,
    sourcePage: 10,
  },
  {
    agencyName: "Department of the Environment",
    projectTitle: "Chesapeake Heights Distribution Replacement Project",
    county: "Calvert",
    category: "Health and Environment",
    projectType: "Project list",
    fundType: "Mixed funds",
    dollarAmount: 6000000,
    sourcePage: 10,
  },
].map((project, index) => ({
  id: `md-capital-${FY_2027}-${String(index + 1).padStart(3, "0")}`,
  fiscalYear: FY_2027,
  budgetStage: "Enacted",
  sourceLabel: SOURCE_METADATA.sourceLabel,
  sourceUrl: SOURCE_METADATA.sourceUrl,
  confidence: SOURCE_METADATA.confidence,
  notes:
    project.projectType === "Project list"
      ? "Specific project-list row normalized from the DBM capital-budget PDF."
      : "Capital program or project row normalized from the DBM capital-budget PDF.",
  ...project,
}));

function cleanText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesSearch(project, query) {
  if (!query) return true;

  const haystack = [
    project.agencyName,
    project.projectTitle,
    project.county,
    project.category,
    project.projectType,
    project.fundType,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function groupTotals(rows, fieldName, denominator, limit = 100) {
  const grouped = new Map();

  for (const row of rows) {
    const name = row[fieldName] || "Unknown";
    grouped.set(name, (grouped.get(name) || 0) + row.dollarAmount);
  }

  return [...grouped.entries()]
    .map(([name, dollarAmount]) => ({
      name,
      dollarAmount,
      percentage:
        denominator > 0 ? (dollarAmount / denominator) * 100 : 0,
    }))
    .sort((a, b) => b.dollarAmount - a.dollarAmount)
    .slice(0, limit);
}

function getPaymentYears() {
  return [
    {
      fiscalYear: FY_2027,
      budgetStage: "Enacted",
      totalAmount: SOURCE_METADATA.officialTotalAmount,
      rowCount: CAPITAL_PROJECTS.length,
      sourceLabel: SOURCE_METADATA.sourceLabel,
      sourceUrl: SOURCE_METADATA.sourceUrl,
    },
  ];
}

function getCapitalDetail(filters) {
  const query = cleanText(filters.search);
  const rows = CAPITAL_PROJECTS.filter((project) => {
    const matchesYear = project.fiscalYear === filters.fiscalYear;
    const matchesAgency =
      filters.agency === "all" || project.agencyName === filters.agency;
    const matchesCounty =
      filters.county === "all" || project.county === filters.county;
    const matchesCategory =
      filters.category === "all" || project.category === filters.category;
    const matchesFund =
      filters.fundType === "all" || project.fundType === filters.fundType;
    const matchesType =
      filters.projectType === "all" || project.projectType === filters.projectType;

    return (
      matchesYear &&
      matchesAgency &&
      matchesCounty &&
      matchesCategory &&
      matchesFund &&
      matchesType &&
      matchesSearch(project, query)
    );
  }).sort((a, b) => b.dollarAmount - a.dollarAmount);

  const filteredTotal = rows.reduce((sum, project) => sum + project.dollarAmount, 0);
  const denominator = SOURCE_METADATA.officialTotalAmount;
  const projects = rows.slice(0, DETAIL_PROJECT_LIMIT).map((project) => ({
    ...project,
    percentage: denominator > 0 ? (project.dollarAmount / denominator) * 100 : 0,
  }));

  return {
    fiscalYear: filters.fiscalYear,
    budgetStage: "Enacted",
    totalAmount: SOURCE_METADATA.officialTotalAmount,
    authorizedBeforeDeauthorizations:
      SOURCE_METADATA.authorizedBeforeDeauthorizations,
    deauthorizations: SOURCE_METADATA.deauthorizations,
    filteredTotal,
    rowCount: rows.length,
    projectLimit: DETAIL_PROJECT_LIMIT,
    projectTotal: projects.reduce((sum, project) => sum + project.dollarAmount, 0),
    isProjectCapped: rows.length > DETAIL_PROJECT_LIMIT,
    metadata: SOURCE_METADATA,
    projects,
    fundSummary: FUND_SUMMARY.map((fund) => ({
      ...fund,
      percentage:
        SOURCE_METADATA.officialTotalAmount > 0
          ? (fund.dollarAmount / SOURCE_METADATA.officialTotalAmount) * 100
          : 0,
    })),
    topAgencies: groupTotals(rows, "agencyName", denominator, 12),
    topCounties: groupTotals(rows, "county", denominator, 20),
    categories: groupTotals(rows, "category", denominator, 20),
    fundTypes: groupTotals(rows, "fundType", denominator, 20),
    projectTypes: groupTotals(rows, "projectType", denominator, 20),
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

  if (view === "years") {
    sendJson(response, 200, {
      metadata: SOURCE_METADATA,
      years: getPaymentYears(),
    });
    return;
  }

  if (view === "detail") {
    const fiscalYear = Number(url.searchParams.get("fiscalYear") || FY_2027);

    if (fiscalYear !== FY_2027) {
      sendJson(response, 404, {
        error: "Only FY 2027 enacted capital-project data is connected right now.",
      });
      return;
    }

    sendJson(response, 200, {
      detail: getCapitalDetail({
        fiscalYear,
        search: url.searchParams.get("q") || "",
        agency: url.searchParams.get("agency") || "all",
        county: url.searchParams.get("county") || "all",
        category: url.searchParams.get("category") || "all",
        fundType: url.searchParams.get("fundType") || "all",
        projectType: url.searchParams.get("projectType") || "all",
      }),
    });
    return;
  }

  sendJson(response, 400, { error: "Unknown Maryland capital-project API view." });
}
