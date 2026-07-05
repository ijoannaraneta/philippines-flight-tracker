# Philippines Flight Price Tracker

Tracks round-trip flight prices from **Manchester (MAN)** and **London Heathrow (LHR)** to **Manila (MNL)** and **Cebu (CEB)**, for a family trip around April–May 2027.

## How it works

- A GitHub Actions cron job runs every 2 days and fetches live prices from Google Flights (via [SerpAPI](https://serpapi.com)).
- Results are committed to `data/history/` as JSON, building up a price history over time.
- A React dashboard (deployed to GitHub Pages) visualises price trends, airlines, stopovers, and airline safety ratings.

## Setup

1. Sign up for a free SerpAPI account at [serpapi.com](https://serpapi.com) (100 free searches/month).
2. In this repo on GitHub, go to **Settings → Secrets and variables → Actions → New repository secret** and add a secret named `SERPAPI_KEY` with your API key.
3. In **Settings → Pages**, set the source to **GitHub Actions** (the deploy workflow handles the rest).
4. Trigger the **Fetch flight prices** workflow manually from the Actions tab (or wait for the next scheduled run).

## Local development

```bash
npm install                # root dependencies (fetch script)
npm run fetch:mock         # generate mock price data (no API key needed)
npm run fetch              # real fetch (needs SERPAPI_KEY env var)

cd web
npm install
npm run dev                # dashboard at http://localhost:5173
```

The dashboard reads data from `web/public/data/`, which is synced from `data/` and `config/` by `npm run sync-data` (run automatically before dev/build).

## Configuration

- `config/routes.json` — origins, destinations, travel dates, currency. Edit this to change dates or add routes.
- `config/airlines.json` — hand-curated safety information for airlines that fly UK → Philippines.

## Search budget

4 routes × ~15 runs/month = ~60 searches/month, comfortably inside SerpAPI's 100 free searches. Manual workflow runs use the same budget, so refresh sparingly.

## Future ideas

- More origins/destinations
- Flexible date scanning (± a few days)
- Price-drop email alerts
