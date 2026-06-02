import { useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

const MARYLAND_DATA_URL =
  "https://opendata.maryland.gov/resource/4mca-332u.json?$limit=50000&$order=fiscal_year DESC";

const SOURCE_URL =
  "https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-CUR-and-CR/4mca-332u";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function findField(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return row[name];
    }
  }

  return "";
}

function getFiscalYear(row) {
  const value = findField(row, [
    "fiscal_year",
    "fiscal_year_",
    "fy",
    "budget_fiscal_year",
    "year",
  ]);

  const match = String(value).match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function getAmount(row) {
  const possibleAmountFields = [
    "amount",
    "budget_amount",
    "actual_expenditures",
    "expenditures",
    "appropriation",
    "total",
  ];

  for (const field of possibleAmountFields) {
    const number = cleanNumber(row[field]);
    if (number !== 0) return number;
  }

  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("amount") ||
      lowerKey.includes("budget") ||
      lowerKey.includes("expenditure") ||
      lowerKey.includes("appropriation")
    ) {
      const number = cleanNumber(value);
      if (number !== 0) return number;
    }
  }

  return 0;
}

function getAssignedName(row) {
  return (
    findField(row, [
      "program_name",
      "program",
      "subprogram_name",
      "subprogram",
      "object_name",
      "object",
      "agency_subobject_name",
      "comptroller_subobject_name",
      "fund_type_name",
      "fund_type",
    ]) || "Uncategorized"
  );
}

function getAgencyName(row) {
  return (
    findField(row, [
      "agency_name",
      "agency",
      "department_name",
      "department",
      "unit_name",
      "unit",
    ]) || "Unknown agency"
  );
}

function getFundType(row) {
  return (
    findField(row, ["fund_type_name", "fund_type", "fund", "fund_name"]) ||
    "Unknown fund type"
  );
}

function getBudgetStage(row) {
  const rowText = Object.values(row).join(" ").toLowerCase();

  if (rowText.includes("actual")) return "Actual";
  if (rowText.includes("working")) return "Working";
  if (rowText.includes("allowance")) return "Allowance";
  if (rowText.includes("appropriation")) return "Appropriation";
  if (rowText.includes("estimated")) return "Estimated";

  return "Latest available";
}

function processMarylandRows(rawRows) {
  const processed = rawRows
    .map((row) => ({
      raw: row,
      fiscalYear: getFiscalYear(row),
      amount: getAmount(row),
      budgetStage: getBudgetStage(row),
    }))
    .filter((item) => item.fiscalYear && item.amount > 0);

  const latestYears = [...new Set(processed.map((item) => item.fiscalYear))]
    .sort((a, b) => b - a)
    .slice(0, 4)
    .sort((a, b) => a - b);

  const selectedRows = processed.filter((item) =>
    latestYears.includes(item.fiscalYear)
  );

  const stageByYear = {};

  for (const item of selectedRows) {
    if (!stageByYear[item.fiscalYear]) {
      stageByYear[item.fiscalYear] = new Set();
    }

    stageByYear[item.fiscalYear].add(item.budgetStage);
  }

  const yearLabels = Object.fromEntries(
    Object.entries(stageByYear).map(([year, stages]) => [
      year,
      [...stages].join(", "),
    ])
  );

  const grouped = new Map();

  for (const item of selectedRows) {
    const row = item.raw;

    const assignedName = getAssignedName(row);
    const agencyName = getAgencyName(row);
    const fundType = getFundType(row);

    const key = `${agencyName}__${assignedName}__${fundType}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        assignedName,
        agencyName,
        fundType,
        dollarAmount: 0,
        yearlyAmounts: {},
      });
    }

    const group = grouped.get(key);
    group.dollarAmount += item.amount;
    group.yearlyAmounts[item.fiscalYear] =
      (group.yearlyAmounts[item.fiscalYear] || 0) + item.amount;
  }

  const totalAmount = [...grouped.values()].reduce(
    (sum, row) => sum + row.dollarAmount,
    0
  );

  const rows = [...grouped.values()]
    .map((row) => ({
      ...row,
      percentage: totalAmount > 0 ? (row.dollarAmount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.dollarAmount - a.dollarAmount);

  return {
    state: "Maryland",
    stateCode: "MD",
    years: latestYears,
    yearLabels,
    totalAmount,
    rows,
  };
}

export default function App() {
  const [selectedState, setSelectedState] = useState("");
  const [spendingData, setSpendingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleStateChange(event) {
    const state = event.target.value;

    setSelectedState(state);
    setSpendingData(null);
    setErrorMessage("");

    if (!state) return;

    if (state !== "MD") {
      setErrorMessage("Only Maryland is available in the first version.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(MARYLAND_DATA_URL);

      if (!response.ok) {
        throw new Error("Could not load Maryland spending data.");
      }

      const rawRows = await response.json();
      const processedData = processMarylandRows(rawRows);

      if (!processedData.rows.length) {
        throw new Error(
          "The data loaded, but no usable spending rows were found. We may need to adjust the dataset field names."
        );
      }

      setSpendingData(processedData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const pieData = spendingData
    ? (() => {
        const topRows = spendingData.rows.slice(0, 8);
        const otherRows = spendingData.rows.slice(8);

        const otherTotal = otherRows.reduce(
          (sum, row) => sum + row.dollarAmount,
          0
        );

        const chartRows = topRows.map((row) => ({
          name: row.assignedName,
          value: row.dollarAmount,
        }));

        if (otherTotal > 0) {
          chartRows.push({
            name: "Other",
            value: otherTotal,
          });
        }

        return chartRows;
      })()
    : [];

  return (
    <main className="page">
      <section className="welcome-card">
        <div className="welcome-left">
          <h1>Welcome.</h1>

          <label htmlFor="state-select">Select your state</label>

          <select
            id="state-select"
            value={selectedState}
            onChange={handleStateChange}
          >
            <option value="">Choose a state</option>
            <option value="MD">Maryland</option>
          </select>
        </div>

        <div className="welcome-right">
          <h2>Public Spending Finder</h2>
          <p>
            Select a state to see how public money was allocated across the
            latest fiscal years available in official budget data.
          </p>
          <p>
            This first version uses official Maryland open budget data. More
            states can be added after the Maryland version is stable.
          </p>
        </div>
      </section>

      {loading && (
        <section className="loading-card">
          <div className="spinner"></div>
          <p>Preparing Maryland spending data...</p>
        </section>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {spendingData && (
        <section className="results-card">
          <div className="results-header">
            <div>
              <h2>
                Here is how {spendingData.state} allocated public funds from FY{" "}
                {spendingData.years[0]} to FY{" "}
                {spendingData.years[spendingData.years.length - 1]}
              </h2>

              <p>
                Data source:{" "}
                <a href={SOURCE_URL} target="_blank" rel="noreferrer">
                  Maryland Operating Budget: CUR and CR
                </a>
              </p>

              <p className="chart-note">
                Years included:{" "}
                {spendingData.years
                  .map(
                    (year) =>
                      `FY ${year} ${
                        spendingData.yearLabels?.[year]
                          ? `(${spendingData.yearLabels[year]})`
                          : ""
                      }`
                  )
                  .join(", ")}
              </p>

              <p className="chart-note">
                Note: the latest available years may include working budgets,
                allowances, appropriations, or estimates, not only final actual
                expenditures.
              </p>
            </div>

            <div className="summary-box">
              <span>Total latest-period amount</span>
              <strong>{formatMoney(spendingData.totalAmount)}</strong>
              <small>{spendingData.rows.length} detailed rows found</small>
            </div>
          </div>

          <div className="chart-and-table">
            <div className="table-section">
              <h3>Detailed allocation list</h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Assigned Name</th>
                      <th>Agency</th>
                      <th>Fund Type</th>
                      <th>Dollar Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>

                  <tbody>
                    {spendingData.rows.map((row, index) => (
                      <tr
                        key={`${row.agencyName}-${row.assignedName}-${index}`}
                      >
                        <td>{row.assignedName}</td>
                        <td>{row.agencyName}</td>
                        <td>{row.fundType}</td>
                        <td>{formatMoney(row.dollarAmount)}</td>
                        <td>{formatPercent(row.percentage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="chart-section">
              <h3>Pie chart by percentage</h3>

              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                  />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </PieChart>
              </ResponsiveContainer>

              <p className="chart-note">
                The pie chart shows the top 8 rows plus “Other” so it stays
                readable. The table keeps the full detailed list.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}