import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import marylandBudgetHandler from "./api/maryland-budget.js";

function marylandBudgetApi() {
  return {
    name: "maryland-budget-api",
    configureServer(server) {
      server.middlewares.use("/api/maryland-budget", (request, response) => {
        marylandBudgetHandler(request, response);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), marylandBudgetApi()],
});
