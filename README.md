# World Cup Quest

World Cup Quest is a mobile-friendly soccer trivia web app focused on the men's FIFA World Cup 2026 field. Players browse a dashboard of teams, pick a nation, and answer team-specific trivia while their progress is stored locally in the browser.

## What is included

- A responsive single-page app with a team dashboard and trivia panel
- Seeded data for the 42 officially qualified teams plus 6 inter-confederation play-off placeholders
- Local score and completion tracking with browser storage
- Azure Static Web Apps configuration for SPA routing

## Project structure

- `index.html` - app shell
- `styles.css` - mobile-first styling
- `app.js` - rendering, quiz flow, and local persistence
- `data/teams.js` - World Cup team seed data
- `data/trivia.js` - generated trivia question set per team
- `staticwebapp.config.json` - Azure Static Web Apps routing

## Local usage

This implementation has no build step and no npm dependency. Open `index.html` in a browser or serve the repo as static files from any local web server.

## Azure hosting summary

Recommended Azure resources for this version:

- Azure Static Web Apps
  - Hosts the SPA, provides global edge delivery, and handles SPA route fallback.
- Azure Application Insights
  - Captures client-side errors and usage telemetry if added in a later iteration.
- Azure Storage Account
  - Optional for static media, backups, or future downloadable content packs.
- Azure Functions
  - Not required for this version because the app ships with bundled seed data, but it is the natural next step if team data or leaderboards move server-side.
- GitHub Actions or Azure DevOps
  - Automates deployment into Static Web Apps.

## Data notes

- The app reflects the 42 teams listed by FIFA as qualified for the men's FIFA World Cup 2026 and reserves 6 additional slots for the March 2026 inter-confederation play-off winners.
- Play-off slot cards are intentionally present but do not yet have quiz content.