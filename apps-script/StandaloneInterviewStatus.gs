var SOURCE_SHEET_NAME = "Form Responses 1";
var STATUS_SHEET_NAME = "Interview Status Updates";
var STATUS_HEADERS = ["InterviewKey", "SK ID", "Original Date", "Original From", "Original To", "Batch", "Status", "Remarks", "Rescheduled Date", "Rescheduled From", "Rescheduled To", "Updated At", "Updated By"];
var PUBLIC_CACHE_KEY = "public_interviews_v2";

function doGet() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(PUBLIC_CACHE_KEY);
    if (cached) return jsonOutput_(JSON.parse(cached));

    var publicRows = mergeInterviewData_().filter(function(row) {
      var status = String(row.Status || "Scheduled").toLowerCase();
      return status !== "completed" && status !== "cancelled";
    }).map(sanitizePublicRow_);

    var serialized = JSON.stringify(publicRows);
    if (serialized.length < 95000) cache.put(PUBLIC_CACHE_KEY, serialized, 60);
    return jsonOutput_(publicRows);
  } catch (error) {
    return jsonOutput_({ ok: false, error: safeError_(error) });
  }
}

function doPost(event) {
  try {
    var request = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    var adminEmail = verifyAdmin_(request.credential);

    if (request.action === "listAdminInterviews") {
      return jsonOutput_({ ok: true, data: mergeInterviewData_(), adminEmail: adminEmail });
    }

    if (request.action === "updateInterviewStatus") {
      validateStatusRequest_(request);
      saveStatusUpdate_(request, adminEmail);
      CacheService.getScriptCache().remove(PUBLIC_CACHE_KEY);
      return jsonOutput_({ ok: true, interviewKey: request.interviewKey, status: request.status });
    }

    throw new Error("Unsupported action.");
  } catch (error) {
    return jsonOutput_({ ok: false, error: safeError_(error) });
  }
}

function verifyAdmin_(credential) {
  if (!credential) throw new Error("Admin sign-in is required.");

  var properties = PropertiesService.getScriptProperties();
  var clientId = properties.getProperty("GOOGLE_CLIENT_ID");
  var allowed = String(properties.getProperty("ADMIN_EMAILS") || "")
    .toLowerCase().split(",").map(function(value) { return value.trim(); }).filter(String);

  if (!clientId || !allowed.length) throw new Error("Admin authentication is not configured.");

  var response = UrlFetchApp.fetch(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential),
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) throw new Error("Google sign-in expired. Please sign in again.");

  var token = JSON.parse(response.getContentText());
  var email = String(token.email || "").toLowerCase();
  if (token.aud !== clientId || String(token.email_verified) !== "true") {
    throw new Error("Google identity verification failed.");
  }
  if (allowed.indexOf(email) === -1) throw new Error("This Google account is not authorised.");
  return email;
}

function validateStatusRequest_(request) {
  var statuses = ["Scheduled", "Completed", "Cancelled", "Rescheduled", "Other"];
  var status = String(request.status || "").trim();
  var remarks = String(request.remarks || "").trim();

  if (!request.interviewKey) throw new Error("Interview key is required.");
  if (statuses.indexOf(status) === -1) throw new Error("Invalid interview status.");
  if ((status === "Cancelled" || status === "Other") && !remarks) {
    throw new Error(status + " requires a reason or remark.");
  }
  if (remarks.length > 500) throw new Error("Remarks must be 500 characters or fewer.");

  if (status === "Rescheduled") {
    if (!request.rescheduledDate || !request.rescheduledFrom || !request.rescheduledTo) {
      throw new Error("New date, start time and end time are required.");
    }
    if (minutes_(request.rescheduledTo) <= minutes_(request.rescheduledFrom)) {
      throw new Error("End time must be after start time.");
    }
  }
}

function saveStatusUpdate_(request, adminEmail) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    getStatusSheet_().appendRow([
      request.interviewKey,
      request.registerId || "",
      request.originalDate || "",
      request.originalFrom || "",
      request.originalTo || "",
      request.batch || "",
      request.status,
      request.remarks || "",
      request.status === "Rescheduled" ? request.rescheduledDate : "",
      request.status === "Rescheduled" ? request.rescheduledFrom : "",
      request.status === "Rescheduled" ? request.rescheduledTo : "",
      new Date(),
      adminEmail
    ]);
  } finally {
    lock.releaseLock();
  }
}

function mergeInterviewData_() {
  var spreadsheet = getSpreadsheet_();
  var sourceSheet = spreadsheet.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) throw new Error("Source sheet not found: " + SOURCE_SHEET_NAME);

  var sourceRows = rowsAsObjects_(sourceSheet);
  var updates = rowsAsObjects_(getStatusSheet_());
  var latest = {};

  updates.forEach(function(update) {
    var key = String(update.InterviewKey || "").trim();
    if (!key) return;
    var updatedAt = new Date(update["Updated At"] || 0).getTime() || 0;
    if (!latest[key] || updatedAt >= latest[key].updatedAt) {
      latest[key] = { updatedAt: updatedAt, update: update };
    }
  });

  return sourceRows.map(function(row) {
    var originalDate = row["Interview Date"];
    var originalFrom = row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"];
    var originalTo = row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"];
    var key = makeInterviewKey_(row);
    var match = latest[key] && latest[key].update;

    row.InterviewKey = key;
    row["Original Interview Date"] = originalDate;
    row["Original Interview From"] = originalFrom;
    row["Original Interview To"] = originalTo;
    row.Status = match ? String(match.Status || "Scheduled") : "Scheduled";
    row.Remarks = match ? String(match.Remarks || "") : "";

    if (match && row.Status === "Rescheduled") {
      row["Interview Date"] = match["Rescheduled Date"] || originalDate;
      row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"] = match["Rescheduled From"] || originalFrom;
      row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"] = match["Rescheduled To"] || originalTo;
    }
    if (match) row["Status Updated At"] = match["Updated At"];
    return row;
  });
}

function rowsAsObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(value) { return String(value).trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(value) { return String(value).trim(); });
  }).map(function(row) {
    var object = {};
    headers.forEach(function(header, index) {
      if (header) object[header] = row[index];
    });
    return object;
  });
}

function getStatusSheet_() {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(STATUS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(STATUS_SHEET_NAME);
    sheet.getRange(1, 1, 1, STATUS_HEADERS.length).setValues([STATUS_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSpreadsheet_() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Spreadsheet integration is not configured.");
  return SpreadsheetApp.openById(spreadsheetId);
}

function makeInterviewKey_(row) {
  return [
    row["Sk Tech Register ID"],
    row["Interview Date"],
    row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"],
    row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"],
    row.Batch
  ].map(function(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }).join("|");
}

function sanitizePublicRow_(row) {
  return {
    "Sk Tech Register ID": row["Sk Tech Register ID"] || "",
    "Round": row.Round || "",
    "Interview Date": row["Interview Date"] || "",
    "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment": row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"] || "",
    "Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment": row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"] || "",
    "Batch": row.Batch || "",
    "Status": row.Status || "Scheduled",
    "Remarks": row.Remarks || ""
  };
}

function minutes_(value) {
  var match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error("Invalid time.");
  return Number(match[1]) * 60 + Number(match[2]);
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeError_(error) {
  var message = error && error.message ? error.message : "Unexpected server error.";
  return message.replace(/Exception:\s*/g, "").slice(0, 250);
}
