import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import marylandBudgetHandler from "./api/maryland-budget.js";
import marylandCapitalProjectsHandler from "./api/maryland-capital-projects.js";
import marylandGrantsLoansHandler from "./api/maryland-grants-loans.js";
import marylandVendorPaymentsHandler from "./api/maryland-vendor-payments.js";

function marylandBudgetApi() {
  return {
    name: "maryland-budget-api",
    configureServer(server) {
      server.middlewares.use("/api/maryland-budget", (request, response) => {
        marylandBudgetHandler(request, response);
      });
      server.middlewares.use(
        "/api/maryland-vendor-payments",
        (request, response) => {
          marylandVendorPaymentsHandler(request, response);
        }
      );
      server.middlewares.use(
        "/api/maryland-capital-projects",
        (request, response) => {
          marylandCapitalProjectsHandler(request, response);
        }
      );
      server.middlewares.use(
        "/api/maryland-grants-loans",
        (request, response) => {
          marylandGrantsLoansHandler(request, response);
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), marylandBudgetApi()],
});
