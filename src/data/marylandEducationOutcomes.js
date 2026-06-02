export const EDUCATION_OUTCOME_SOURCES = [
  {
    id: "msde-mcap-2024",
    label: "MSDE 2023-2024 MCAP statewide results",
    url: "https://news.maryland.gov/msde/state-assessment-scores/",
    confidence: "High",
  },
  {
    id: "msde-graduation-2024",
    label: "MSDE 2024 cohort graduation release",
    url: "https://news.maryland.gov/msde/state-graduation-rate/",
    confidence: "High",
  },
  {
    id: "naep-reading-grade-4-2024",
    label: "NCES NAEP 2024 reading snapshot, Maryland grade 4",
    url: "https://nces.ed.gov/nationsreportcard/subject/publications/stt2024/pdf/2024220MD4.pdf",
    confidence: "High",
  },
  {
    id: "naep-reading-grade-8-2024",
    label: "NCES NAEP 2024 reading snapshot, Maryland grade 8",
    url: "https://nces.ed.gov/nationsreportcard/subject/publications/stt2024/pdf/2024220MD8.pdf",
    confidence: "High",
  },
  {
    id: "naep-math-grade-4-2024",
    label: "NCES NAEP 2024 mathematics snapshot, Maryland grade 4",
    url: "https://nces.ed.gov/nationsreportcard/subject/publications/stt2024/pdf/2024219MD4.pdf",
    confidence: "High",
  },
  {
    id: "naep-math-grade-8-2024",
    label: "NCES NAEP 2024 mathematics snapshot, Maryland grade 8",
    url: "https://nces.ed.gov/nationsreportcard/subject/publications/stt2024/pdf/2024219MD8.pdf",
    confidence: "High",
  },
];

export const EDUCATION_OUTCOME_SUMMARY = {
  rating: "Mixed",
  label: "Education evidence rating",
  period: "2023-2024 and 2024 public releases",
  rationale:
    "Graduation improved and reading is broadly near the public-school national NAEP benchmark, but state math proficiency remains low and achievement gaps remain material.",
  guardrail:
    "This rating compares public outcomes with budget context; it does not prove that a specific allocation caused a specific result.",
};

export const EDUCATION_OUTCOME_METRICS = [
  {
    id: "graduation-four-year",
    group: "Graduation",
    label: "Four-year cohort graduation rate",
    value: "87.6%",
    result: "Strong",
    comparison: "Highest Maryland rate since 2017; up 1.8 percentage points.",
    sourceId: "msde-graduation-2024",
  },
  {
    id: "graduation-five-year",
    group: "Graduation",
    label: "Five-year cohort graduation rate",
    value: "87.4%",
    result: "Moderate",
    comparison: "Down from 88.2% in the prior year.",
    sourceId: "msde-graduation-2024",
  },
  {
    id: "mcap-ela",
    group: "State assessment",
    label: "MCAP ELA proficiency",
    value: "48.4%",
    result: "Mixed",
    comparison: "Up from 47.9% in 2022-2023.",
    sourceId: "msde-mcap-2024",
  },
  {
    id: "mcap-math",
    group: "State assessment",
    label: "MCAP mathematics proficiency",
    value: "24.1%",
    result: "Weak",
    comparison: "Up from 23.3%, but still below one in four students.",
    sourceId: "msde-mcap-2024",
  },
  {
    id: "naep-reading-grade-4",
    group: "NAEP reading",
    label: "Grade 4 reading",
    value: "216 avg / 34% proficient",
    result: "Moderate",
    comparison: "Average score was not significantly different from the national public-school average.",
    sourceId: "naep-reading-grade-4-2024",
  },
  {
    id: "naep-reading-grade-8",
    group: "NAEP reading",
    label: "Grade 8 reading",
    value: "258 avg / 33% proficient",
    result: "Moderate",
    comparison: "Average score was not significantly different from the national public-school average.",
    sourceId: "naep-reading-grade-8-2024",
  },
  {
    id: "naep-math-grade-4",
    group: "NAEP mathematics",
    label: "Grade 4 mathematics",
    value: "234 avg / 37% proficient",
    result: "Mixed",
    comparison: "Average score was lower than the national public-school average of 237.",
    sourceId: "naep-math-grade-4-2024",
  },
  {
    id: "naep-math-grade-8",
    group: "NAEP mathematics",
    label: "Grade 8 mathematics",
    value: "268 avg / 25% proficient",
    result: "Weak",
    comparison: "Average score was lower than the national public-school average of 272.",
    sourceId: "naep-math-grade-8-2024",
  },
];

export const EDUCATION_EQUITY_GAPS = [
  {
    id: "grade-4-reading-black-white",
    label: "Grade 4 reading Black-White score gap",
    value: "36 points",
    sourceId: "naep-reading-grade-4-2024",
  },
  {
    id: "grade-4-reading-hispanic-white",
    label: "Grade 4 reading Hispanic-White score gap",
    value: "41 points",
    sourceId: "naep-reading-grade-4-2024",
  },
  {
    id: "grade-8-math-econ-gap",
    label: "Grade 8 math economic-disadvantage score gap",
    value: "31 points",
    sourceId: "naep-math-grade-8-2024",
  },
  {
    id: "grade-8-reading-econ-gap",
    label: "Grade 8 reading economic-disadvantage score gap",
    value: "29 points",
    sourceId: "naep-reading-grade-8-2024",
  },
];

export const EDUCATION_BUDGET_MATCHERS = [
  "Elementary and Secondary Education",
  "Higher Education",
  "State Department of Education",
  "Maryland Higher Education Commission",
  "Support for State Operated Institutions of Higher Education",
  "Interagency Commission On School Construction",
];
