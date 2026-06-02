# Maryland Operating Budget Explorer

React/Vite dashboard for exploring Maryland operating budget allocations by
fiscal year, agency, program, unit, and fund type.

## Data Source

The app queries Maryland's Socrata open-data API for the current operating
budget dataset:

- Dataset: Maryland Operating Budget (current)
- Identifier: `yu65-jmmv`
- Source: https://opendata.maryland.gov/Budget/Maryland-Operating-Budget-current-/yu65-jmmv

The app uses the same-origin `/api/maryland-budget` route to run server-side
Socrata aggregation. That keeps the browser from downloading the full dataset
and avoids CORS issues with the upstream open-data API.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```
