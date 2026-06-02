import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import marylandBudgetHandler from "./api/maryland-budget.js";
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
    },
  };
}

export default defineConfig({
  plugins: [react(), marylandBudgetApi()],
});
