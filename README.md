# EDGE GLASS Social Intelligence Agent

An AI-assisted social media research and content-planning system built with Google Apps Script, Google Sheets, the YouTube Data API v3 and Google Gemini.

The project was developed to help organise recurring market research, turn public video signals into structured insights, and support Instagram Reel concept development.

> **Portfolio note:** This repository documents the system's architecture and workflows. Add implementation files only after removing credentials, private business data and company-specific information, and confirming that you have permission to publish them.

## What it does

### 1. Daily social media intelligence

- Searches YouTube across a set of smart-glass and related architecture topics.
- Collects public video metadata and available engagement statistics.
- Avoids reprocessing video URLs already stored in the research sheet.
- Sends collected records to Gemini in small batches for structured analysis.
- Tracks whether findings are new, changed, continuing or unchanged.
- Stores research history and creates a daily intelligence report.
- Emails the report to configured recipients.
- Runs automatically using a time-driven Google Apps Script trigger.

### 2. Instagram Content Studio

- Accepts a topic supplied by the user through a Google Sheets sidebar.
- Uses YouTube search results as supporting research and inspiration.
- Asks Gemini to produce structured Instagram Reel concepts.
- Saves the generated ideas to a dedicated Google Sheets tab.

A concept can include an opening hook, story outline, scene-by-scene direction, voiceover or dialogue, on-screen text, caption, hashtags and call to action.

## Architecture

```text
Google Apps Script (JavaScript, V8 runtime)
        |
        +---- YouTube Data API v3
        |       +---- Topic-based video search
        |       +---- Public video metadata and statistics
        |
        +---- Google Gemini API
        |       +---- Batch analysis
        |       +---- Structured content ideation
        |
        +---- Google Sheets
        |       +---- Research records
        |       +---- Intelligence history
        |       +---- Daily reports
        |       +---- Instagram content ideas
        |
        +---- Apps Script Mail service
                +---- Daily email report
```

The automation runs on Google's Apps Script infrastructure. Google Sheets acts as the data store and working interface; no separately managed server is required.

## Technology

| Component | Technology |
|---|---|
| Automation and backend | JavaScript on Google Apps Script V8 |
| User interface | HTML, CSS and client-side JavaScript |
| Spreadsheet data store | Google Sheets |
| Video research | YouTube Data API v3 |
| AI analysis and ideation | Google Gemini API |
| Sidebar-to-backend communication | `google.script.run` |
| Scheduling | Apps Script time-driven triggers |
| Email delivery | Apps Script Mail service |

## Important scope and limitations

- The Content Studio uses YouTube research to inform Instagram ideas. It does **not** directly monitor Instagram Reels or provide Instagram trend analytics.
- It generates content concepts and scripts; it does **not** render finished videos, publish posts or schedule Instagram uploads.
- Research is limited by the availability and quotas of the connected APIs.
- AI-generated insights and creative suggestions should be reviewed before business use.

## Configuration and security

Configure API credentials through **Apps Script Project Settings → Script Properties**. Do not commit API keys, spreadsheet IDs or URLs, personal data, private email addresses, or real customer/business records.

Suggested property names:

- `YOUTUBE_API_KEY`
- `GEMINI_API_KEY`

If the implementation uses additional configuration values, store those securely as Script Properties too. Keep secrets out of source files and version history.

## Project structure

The repository will be organised as the implementation is prepared for publication:

- `src/` — sanitised Apps Script backend and sidebar source
- `docs/` — architecture, setup and workflow documentation
- `screenshots/` — approved screenshots with sensitive information removed

Only files that are safe and authorised for public release should be added.

## AI-assisted development

AI tools were used to assist with code generation and development. The project owner is documenting the system's architecture, integrations, workflows, configuration and operational behaviour, and is building an understanding of how the components work together.

## Status

The daily research and reporting workflow and the on-demand content ideation workflow have been tested in the working Google Apps Script environment. The public repository is being prepared separately; implementation files will be added after a security and permission review.
