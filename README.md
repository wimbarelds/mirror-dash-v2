# Mirror Dash V2

This is a dashboard for my smartmirror.
The dashboard shows date/time/weather/public transit info.

## Pages

Both are deployed to GitHub Pages:

- [Mirror Dash](https://wimbarelds.github.io/mirror-dash-v2/) - the dashboard itself, on live data
- [Mock data](https://wimbarelds.github.io/mirror-dash-v2/mockdata.html) - the same dashboard on recorded weather from 2025 and a simulated clock, for testing the layout

The mock data page has a small button per part of the screen (clock, buses, weather) at the top. Each opens a panel that can be dragged around. The weather panel picks notable days per season, or an exact date and time. The weather and bus panels can also simulate a failing data source (CORS, 404 or 500). The page is never loaded by the dashboard, and its data only downloads when you open it.

The moment shown is kept in the URL (e.g. `mockdata.html?t=2025-01-10T12:00`), so a situation can be bookmarked or shared.

## Commands

- `vp i` - install dependencies
- `vp dev` - run in dev mode (the mock data page is at `/mockdata.html`)
- `vp build` - create a production build
- `vp check` - run lint, format, typecheck
- `vp check --fix` - run lint, format, typecheck, with autofix
- `node scripts/fetch-mockdata-weather.mjs 2024-12-31 2026-01-01` - download the recorded weather again
