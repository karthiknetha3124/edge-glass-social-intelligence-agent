// ==================================================
// EDGE GLASS | SOCIAL MEDIA INTELLIGENCE AGENT
// ==================================================

// --------------------------------------------------
// 1. CONFIGURATION
// --------------------------------------------------

function getSpreadsheetUrl_() {
  const url = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_URL");
  if (!url) throw new Error("Spreadsheet URL missing. Set SPREADSHEET_URL in Script Properties.");
  return url;
}


// --------------------------------------------------
// 2. DATABASE SETUP
// --------------------------------------------------
function setupEdgeGlassDatabase() {
  const ss = SpreadsheetApp.openByUrl(getSpreadsheetUrl_());

 const requiredSheets = [
  'Trend Research',
  'Content Ideas',
  'Competitor Research',
  'Audience Insights',
  'Daily Reports',
  'Intelligence History'
];

  requiredSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  Logger.log('Connected successfully!');
  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log('Available sheets: ' + requiredSheets.join(', '));
}

// --------------------------------------------------
// 3. YOUTUBE RESEARCH COLLECTION
// --------------------------------------------------

function runMultiTopicYouTubeResearch() {
  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("YOUTUBE_API_KEY");

  if (!apiKey) throw new Error("YouTube API key missing.");

  const ss = SpreadsheetApp.openByUrl(getSpreadsheetUrl_());
  const sheet = ss.getSheetByName("Trend Research");

  if (!sheet) throw new Error("Trend Research tab not found.");

  const topics = [
    "smart glass PDLC technology",
    "modern architecture interior design trends",
    "smart glass hospital patient privacy",
    "smart glass hotel hospitality applications",
    "smart glass corporate office conference rooms",
    "smart glass construction real estate",
    "smart glass frequently asked questions",
    "smart glass vs privacy film blinds"
  ];

  // Collect previously stored video URLs to avoid duplicates.
  const existingUrls = new Set();

  if (sheet.getLastRow() > 1) {
    const urls = sheet.getRange(
      2, 4, sheet.getLastRow() - 1, 1
    ).getValues();

    urls.forEach(row => existingUrls.add(row[0]));
  }

  const videos = new Map();

  // Search all eight research topics.
  topics.forEach(topic => {
    const url =
      "https://www.googleapis.com/youtube/v3/search" +
      "?part=snippet" +
      "&type=video" +
      "&maxResults=5" +
      "&order=relevance" +
      "&q=" + encodeURIComponent(topic) +
      "&key=" + encodeURIComponent(apiKey);

    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    if (data.error) {
      throw new Error(data.error.message);
    }

    (data.items || []).forEach(item => {
      const id = item.id.videoId;

      if (id && !videos.has(id)) {
        videos.set(id, {
          id: id,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          published: item.snippet.publishedAt,
          topic: topic
        });
      }
    });
  });

  const videoList = Array.from(videos.values());

  if (videoList.length === 0) {
    Logger.log("No videos found.");
    return;
  }

  // Retrieve engagement statistics.
  const ids = videoList.map(video => video.id);

  const statsUrl =
    "https://www.googleapis.com/youtube/v3/videos" +
    "?part=statistics" +
    "&id=" + ids.join(",") +
    "&key=" + encodeURIComponent(apiKey);

  const statsResponse = UrlFetchApp.fetch(statsUrl);
  const statsData = JSON.parse(statsResponse.getContentText());

  const statsMap = {};

  (statsData.items || []).forEach(video => {
    statsMap[video.id] = video.statistics;
  });

  // Prepare new spreadsheet rows.
  const rows = [];

  videoList.forEach(video => {
    const videoUrl =
      "https://www.youtube.com/watch?v=" + video.id;

    if (existingUrls.has(videoUrl)) return;

    const stats = statsMap[video.id] || {};

    const views = Number(stats.viewCount || 0);
    const likes = stats.likeCount !== undefined
      ? Number(stats.likeCount)
      : "Not available";

    rows.push([
      new Date(),
      "YouTube",
      video.title + " | " + video.channel,
      videoUrl,
      "Views: " + views + " | Likes: " + likes,
      video.topic + " | Published: " + video.published,
      "Research opportunity: " + video.topic
    ]);
  });

  if (rows.length > 0) {
    sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      7
    ).setValues(rows);
  }

  Logger.log("Multi-topic research completed.");
  Logger.log("Unique videos discovered: " + videoList.length);
  Logger.log("New videos saved: " + rows.length);
  Logger.log("Duplicates skipped: " + (videoList.length - rows.length));
}
// ==========================================
// 4. AI VIDEO ANALYSIS & HISTORICAL TRACKING
// ==========================================
function analyzeNextFiveVideos() {

  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  if (!apiKey) throw new Error("Gemini API key missing.");

  const ss = SpreadsheetApp.openByUrl(getSpreadsheetUrl_());
  const sheet = ss.getSheetByName("Trend Research");
  const historySheet = ss.getSheetByName("Intelligence History");

  if (!sheet || sheet.getLastRow() < 2) {
    throw new Error("No research records found.");
  }

  if (!historySheet) {
    throw new Error("Intelligence History sheet not found.");
  }

  // Validate history headers.
  const expectedHeaders = [
    "Analysis Date",
    "Discovery Date",
    "Source URL",
    "Topic",
    "Relevance Score",
    "Target Audience",
    "Content Opportunity",
    "Recommended Platform",
    "Content Format",
    "Priority",
    "AI Reasoning",
    "Change Status"
  ];

  const actualHeaders = historySheet
    .getRange(1, 1, 1, 12)
    .getDisplayValues()[0];

  if (actualHeaders.some((header, index) =>
    header.trim() !== expectedHeaders[index]
  )) {
    throw new Error("Intelligence History headers do not match.");
  }

  // Set existing analysis headers.
  const headers = [
    "AI Relevance Score",
    "Target Audience",
    "Content Opportunity",
    "Recommended Platform",
    "Content Format",
    "Priority",
    "AI Reasoning",
    "Analysis Status"
  ];

  sheet.getRange(1, 8, 1, 8).setValues([headers]);

  const lastRow = sheet.getLastRow();

  const data = sheet.getRange(
    2, 1, lastRow - 1, 15
  ).getValues();

  // Select five unanalyzed records.
  const batch = [];

  data.forEach((row, index) => {

    if (
      String(row[14]).trim().toLowerCase() !== "done" &&
      batch.length < 5
    ) {
      batch.push({
        id: batch.length + 1,
        rowNumber: index + 2,
        title: row[2],
        source: row[3],
        popularity: row[4],
        researchTopic: row[5]
      });
    }

  });

  if (batch.length === 0) {
    Logger.log("All videos have been analysed.");
    return;
  }

  Logger.log("Videos selected: " + batch.length);

  // Load historical records for comparison.
  const historyLastRow = historySheet.getLastRow();

  const historyData = historyLastRow >= 2
    ? historySheet.getRange(
        2, 2, historyLastRow - 1, 10
      ).getDisplayValues()
    : [];

  // Use the latest 40 historical records to keep
  // the Gemini prompt manageable.
  const historicalRecords = historyData
    .slice(-40)
    .map(row => ({
      discoveryDate: row[0],
      topic: row[2],
      relevanceScore: row[3],
      targetAudience: row[4],
      contentOpportunity: row[5],
      recommendedPlatform: row[6],
      contentFormat: row[7],
      priority: row[8],
      reasoning: row[9]
    }));

  Logger.log(
    "Historical records supplied: " +
    historicalRecords.length
  );

  // Build intelligence comparison prompt.
  const prompt = `
You are the senior social media intelligence analyst
for EDGE GLASS, a smart glass and PDLC solutions company.

Analyse the following newly collected YouTube metadata.

IMPORTANT:
- You are analysing metadata, NOT watching videos.
- Do not invent video contents or technical specifications.
- Do not treat views as proof of quality or a current trend.
- Evaluate relevance to EDGE GLASS.
- Recommend original content opportunities.
- Use cautious language where evidence is limited.

NEW VIDEOS:
${JSON.stringify(batch)}

HISTORICAL INTELLIGENCE:
${JSON.stringify(historicalRecords)}

TASK:

Analyse every new video and compare its findings with
the supplied historical intelligence.

Determine whether its opportunity represents a genuinely
new finding or relates to something already recorded.

Return ONLY a valid JSON array with one object per video.

Each object must contain:

id
relevanceScore (integer from 1 to 10)
targetAudience
contentOpportunity
recommendedPlatform (Instagram, LinkedIn or YouTube)
contentFormat (Reel, Carousel, Post or Video)
priority (High, Medium or Low)
reasoning
changeStatus (NEW, CHANGED, CONTINUING or NO CHANGE)

CHANGE DETECTION RULES:

1. NEW:
A genuinely distinct opportunity not represented
in historical intelligence.

2. CHANGED:
An existing opportunity with a meaningful new development,
such as a different audience need or a materially different
content opportunity.

3. CONTINUING:
An existing relevant topic with a meaningful additional
observation that supports continued attention.

4. NO CHANGE:
Repeated information without a meaningful development.

ADDITIONAL RULES:

- A different source URL does not automatically mean NEW.
- Similar wording does not automatically mean CHANGED.
- Do not invent market trends or developments.
- Compare topic, audience, opportunity and reasoning.
- Use NO CHANGE when evidence is insufficient.
- Do not confuse a new video with a new market opportunity.
- Every supplied video must receive one classification.
- Preserve the original video ID.
`;

  // Gemini model.
  const model = "gemini-3.5-flash-lite";

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model + ":generateContent";

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  };

  let response;
  let result;

  // Retry temporary API failures.
  for (let attempt = 1; attempt <= 3; attempt++) {

    response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-goog-api-key": apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();

    if (status === 200) {
      result = JSON.parse(response.getContentText());
      break;
    }

    if (
      attempt === 3 ||
      ![429, 500, 502, 503, 504].includes(status)
    ) {
      throw new Error(
        "Gemini API error " + status + ": " +
        response.getContentText()
      );
    }

    Utilities.sleep(attempt * 2000);
  }

  if (
    !result ||
    !result.candidates ||
    !result.candidates.length ||
    !result.candidates[0].content ||
    !result.candidates[0].content.parts
  ) {
    throw new Error("Gemini returned no analysis.");
  }

  const answer = result.candidates[0]
    .content.parts
    .map(part => part.text || "")
    .join("")
    .trim();

  const cleanAnswer = answer
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const analyses = JSON.parse(cleanAnswer);

  if (!Array.isArray(analyses)) {
    throw new Error("Invalid AI analysis format.");
  }

  const resultsById = {};

  analyses.forEach(item => {
    if (resultsById[item.id]) {
      throw new Error("Duplicate video ID returned by Gemini.");
    }

    resultsById[item.id] = item;
  });

  // Validate every result before writing anything.
  const changeStatuses = {};

  const output = batch.map(video => {

    const item = resultsById[video.id];

    if (!item) {
      throw new Error(
        "Missing analysis for video " + video.id
      );
    }

    const score = Number(item.relevanceScore);

    if (
      !Number.isFinite(score) ||
      score < 1 ||
      score > 10
    ) {
      throw new Error(
        "Invalid relevance score for video " + video.id
      );
    }

    if (
      !["High", "Medium", "Low"].includes(item.priority)
    ) {
      throw new Error(
        "Invalid priority for video " + video.id
      );
    }

    const validStatuses = [
      "NEW",
      "CHANGED",
      "CONTINUING",
      "NO CHANGE"
    ];

    const changeStatus = String(
      item.changeStatus || ""
    ).trim().toUpperCase();

    if (!validStatuses.includes(changeStatus)) {
      throw new Error(
        "Invalid change status for video " + video.id
      );
    }

    const requiredTextFields = [
      "targetAudience",
      "contentOpportunity",
      "recommendedPlatform",
      "contentFormat",
      "reasoning"
    ];

    requiredTextFields.forEach(field => {
      if (
        typeof item[field] !== "string" ||
        !item[field].trim()
      ) {
        throw new Error(
          "Missing " + field + " for video " + video.id
        );
      }
    });

    if (
      !["Instagram", "LinkedIn", "YouTube"]
        .includes(item.recommendedPlatform)
    ) {
      throw new Error(
        "Invalid recommended platform for video " + video.id
      );
    }

    if (
      !["Reel", "Carousel", "Post", "Video"]
        .includes(item.contentFormat)
    ) {
      throw new Error(
        "Invalid content format for video " + video.id
      );
    }

    changeStatuses[video.id] = changeStatus;

    return [
      score,
      item.targetAudience,
      item.contentOpportunity,
      item.recommendedPlatform,
      item.contentFormat,
      item.priority,
      item.reasoning,
      "Done"
    ];

  });

  // Check existing history URLs to prevent duplicates.
  const currentHistoryLastRow = historySheet.getLastRow();

  const existingUrls = new Set(
    currentHistoryLastRow >= 2
      ? historySheet.getRange(
          2, 3, currentHistoryLastRow - 1, 1
        ).getDisplayValues().flat()
      : []
  );

  const analysisDate = new Date();
  const historyRows = [];

  // Prepare historical records.
  batch.forEach((video, index) => {

    const original = sheet.getRange(
      video.rowNumber, 1, 1, 15
    ).getValues()[0];

    const sourceUrl = String(original[3] || "").trim();

    if (!sourceUrl || existingUrls.has(sourceUrl)) {
      return;
    }

    const item = output[index];

    historyRows.push([
      analysisDate,
      original[0],
      sourceUrl,
      original[2],
      item[0],
      item[1],
      item[2],
      item[3],
      item[4],
      item[5],
      item[6],
      changeStatuses[video.id]
    ]);

    existingUrls.add(sourceUrl);

  });

  // Save history first.
  if (historyRows.length > 0) {

    const historyStartRow = historySheet.getLastRow() + 1;

    historySheet.getRange(
      historyStartRow,
      1,
      historyRows.length,
      12
    ).setValues(historyRows);

    historySheet.getRange(
      historyStartRow,
      1,
      historyRows.length,
      2
    ).setNumberFormat("dd/MM/yyyy HH:mm");

  }

  // Save analysis results to Trend Research.
  batch.forEach((video, index) => {

    sheet.getRange(
      video.rowNumber,
      8,
      1,
      8
    ).setValues([output[index]]);

  });

  Logger.log("AI analysis completed successfully.");
  Logger.log("Videos analysed: " + batch.length);
  Logger.log("Historical records added: " + historyRows.length);
  Logger.log("Model: " + model);

  // Log classification totals.
  const counts = {
    NEW: 0,
    CHANGED: 0,
    CONTINUING: 0,
    "NO CHANGE": 0
  };

  Object.values(changeStatuses).forEach(status => {
    counts[status]++;
  });

  Logger.log("Change classification: " + JSON.stringify(counts));
}

// --------------------------------------------------
// 5. DAILY INTELLIGENCE REPORT
// --------------------------------------------------

function generateDailyIntelligenceReport() {

  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  if (!apiKey) throw new Error("Gemini API key missing.");

  const ss = SpreadsheetApp.openByUrl(getSpreadsheetUrl_());
  const research = ss.getSheetByName("Trend Research");
  const sheet = ss.getSheetByName("Daily Reports");

  if (!research || !sheet) {
    throw new Error("Required sheets not found.");
  }

  // Read analysed research.
  const lastRow = research.getLastRow();

  const data = research.getRange(
    2, 1, lastRow - 1, 15
  ).getValues();

  const records = data
    .filter(row =>
      String(row[14]).toLowerCase() === "done"
    )
    .map(row => ({
      title: row[2],
      source: row[3],
      popularity: row[4],
      topic: row[5],
      score: row[7],
      audience: row[8],
      opportunity: row[9],
      platform: row[10],
      format: row[11],
      priority: row[12],
      reasoning: row[13]
    }));

  if (records.length === 0) {
    throw new Error("No analysed videos found.");
  }

  Logger.log("Records ready: " + records.length);

  const prompt = `
You are the senior marketing intelligence analyst
for EDGE GLASS, a smart glass and PDLC solutions company.

Analyse the following research records.

RESEARCH:
${JSON.stringify(records)}

Create a professional marketing intelligence report.

Return ONLY valid JSON with these exact fields:

{
  "executiveSummary": "A concise executive summary.",
  "topOpportunities": "Five ranked content opportunities with explanations and target audiences.",
  "audienceInsights": "The most relevant customer segments and their interests.",
  "instagramStrategy": "Specific Instagram recommendations.",
  "linkedinStrategy": "Specific LinkedIn recommendations.",
  "youtubeStrategy": "Specific YouTube recommendations.",
  "priorityActionPlan": "Five practical actions ranked by priority."
}

RULES:

1. Use only the supplied research as evidence.
2. Make recommendations specific to EDGE GLASS.
3. Do not invent market statistics or competitor performance.
4. Do not invent technical product specifications.
5. Distinguish research observations from recommendations.
6. Avoid generic marketing advice.
7. Make recommendations commercially practical.
8. Each field must contain readable text.
9. Do not omit any field.
`;


const models = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite"
];
const payload = {
  contents: [{
    parts: [{ text: prompt }]
  }],
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 4000,
    responseMimeType: "application/json"
  }
};

let result = null;
let model = null;
let lastError = "";

for (const candidate of models) {
  Logger.log("Trying model: " + candidate);

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    candidate + ":generateContent";

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-goog-api-key": apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();

    if (status === 200) {
      const data = JSON.parse(response.getContentText());

      if (
        data.candidates &&
        data.candidates.length &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
      ) {
        result = data;
        model = candidate;

        Logger.log("SUCCESS: " + candidate);
        break;
      }

      lastError = "Empty response from " + candidate;

    } else {
      lastError = "HTTP " + status + " from " +
        candidate + ": " + response.getContentText();

      Logger.log("FAILED: " + lastError);

      // Don't retry permanent authentication or request errors.
      if ([400, 401, 403, 404].includes(status)) {
        throw new Error(lastError);
      }
    }

  } catch (error) {
    if ([400, 401, 403, 404].some(code =>
      String(error.message).includes("HTTP " + code)
    )) {
      throw error;
    }

    lastError = error.message;
    Logger.log("ERROR: " + candidate + " | " + lastError);
  }

  Utilities.sleep(300);
}

if (!result) {
  throw new Error(
    "All Gemini models failed. Last error: " + lastError
  );
}

Logger.log("Report generated using: " + model);


  if (!result || !result.candidates ||
      !result.candidates.length) {
    throw new Error("Gemini returned no report.");
  }

  const answer = result.candidates[0]
    .content.parts
    .map(part => part.text || "")
    .join("")
    .trim();

  const report = JSON.parse(
    answer.replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
  );

  const requiredFields = [
    "executiveSummary",
    "topOpportunities",
    "audienceInsights",
    "instagramStrategy",
    "linkedinStrategy",
    "youtubeStrategy",
    "priorityActionPlan"
  ];

  requiredFields.forEach(field => {
    if (
      typeof report[field] !== "string" ||
      !report[field].trim()
    ) {
      throw new Error("Missing or invalid field: " + field);
    }
  });



  // Save all eight columns in the correct order.
  const output = [
    new Date(),
    records.length,
    report.executiveSummary,
    report.topOpportunities,
    report.audienceInsights,
    [
      "INSTAGRAM\n" + report.instagramStrategy,
      "LINKEDIN\n" + report.linkedinStrategy,
      "YOUTUBE\n" + report.youtubeStrategy
    ].join("\n\n"),
    report.priorityActionPlan,
  ];

  const newRow = sheet.getLastRow() + 1;

  sheet.getRange(newRow, 1, 1, 7)
    .setValues([output]);

  // Professional spreadsheet formatting.
  const widths = [
  130, 120, 350, 430,
  350, 430, 380
];

  widths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });

  sheet.getRange(newRow, 1, 1, 7)
    .setWrap(true)
    .setVerticalAlignment("top");

  sheet.setRowHeight(newRow, 400);
  sheet.setFrozenRows(1);

  Logger.log("Daily Intelligence Report generated!");
  Logger.log("Records analysed: " + records.length);
  Logger.log("All seven sections saved separately.");
}

// --------------------------------------------------
// 6. MAIN AUTOMATION CONTROLLER
// --------------------------------------------------

function runEdgeGlassDailyIntelligence() {

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(1000)) {
    Logger.log("Another intelligence run is already active.");
    return;
  }

  const startTime = Date.now();
  const maxRuntime = 4 * 60 * 1000;

  try {

    Logger.log("EDGE GLASS DAILY INTELLIGENCE STARTED");

    // STEP 1: Collect new YouTube research.
    Logger.log("Step 1: Collecting new research...");

    runMultiTopicYouTubeResearch();

    Logger.log("Research collection completed.");

    // STEP 2: Analyse all pending records in batches of five.
    Logger.log("Step 2: Analysing pending videos...");

    const ss = SpreadsheetApp.openByUrl(getSpreadsheetUrl_());
    const research = ss.getSheetByName("Trend Research");

    function getPendingCount() {
      const lastRow = research.getLastRow();

      if (lastRow < 2) return 0;

      const statuses = research.getRange(
        2, 15, lastRow - 1, 1
      ).getValues();

      return statuses.filter(
        row => String(row[0]).toLowerCase() !== "done"
      ).length;
    }

    let pending = getPendingCount();

    Logger.log("Pending videos: " + pending);

    while (pending > 0) {

      if (Date.now() - startTime > maxRuntime) {
        throw new Error(
          "Runtime safety limit reached. " +
          pending + " videos remain pending."
        );
      }

      const previousPending = pending;
