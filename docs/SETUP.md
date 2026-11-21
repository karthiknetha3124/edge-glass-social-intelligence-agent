# Setup and configuration

## Prerequisites

- A Google account with access to Google Apps Script and Google Sheets.
- A Google Cloud project with the YouTube Data API v3 enabled and an API key.
- A Gemini API key.
- A spreadsheet to use as the agent's data store.

## 1. Add the project files

Create a Google Apps Script project bound to the target spreadsheet (or use an existing authorised project). Add the backend file from `src/EGSocial.gs` and add an HTML file named `ContentStudio`, then paste the contents of `src/ContentStudio.html`.

## 2. Configure Script Properties

In Apps Script, open **Project Settings → Script Properties** and add:

| Property | Value |
|---|---|
| `SPREADSHEET_URL` | URL of the spreadsheet used by this project |
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 key |
| `GEMINI_API_KEY` | Your Gemini API key |
| `REPORT_RECIPIENTS` | Comma-separated report email recipients |

Keep the values private. Do not commit API keys, spreadsheet URLs, or recipient email addresses to Git.

## 3. Initialise the spreadsheet

Run `setupEdgeGlassDatabase()` once and authorise the requested Google permissions. Confirm the required tabs exist before running the automation.

## 4. Configure the daily workflow

Run `runEdgeGlassDailyIntelligence()` manually once to authorise and test the end-to-end workflow. Configure the time-driven trigger in Apps Script to run at the desired daily time. Apps Script time triggers run within a selected time window, not necessarily at an exact minute.

## 5. Enable the Content Studio menu

Run `installContentStudioOpenTrigger()` once and authorise it. Reopen or refresh the spreadsheet. Use the **EDGE GLASS Content Studio** menu to open the sidebar and generate ideas.

## Security notes

- Store credentials and environment-specific values in Script Properties.
- Restrict access to the spreadsheet and Apps Script project to trusted collaborators.
- Review generated insights and scripts before using them externally.
- API usage is subject to provider quotas, terms and pricing.
