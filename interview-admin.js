(function() {
  "use strict";

  const config = window.SKTECH_INTERVIEW_ADMIN_CONFIG || {};
  const statusApi = window.SKTechInterviewStatus;
  let googleCredential = "";
  let adminRows = [];
  let selectedRow = null;
  let selectedStatus = "";
  let refreshTimer = null;
  let requestInFlight = false;

  const els = {};

  function byId(id) { return document.getElementById(id); }

  function setMessage(message, type) {
    els.adminMessage.textContent = message || "";
    els.adminMessage.className = "admin-message" + (type ? " " + type : "");
  }

  function decodeGoogleCredential(token) {
    try {
      const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(atob(payload).split("").map(function(char) {
        return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
      }).join("")));
    } catch (error) {
      return {};
    }
  }

  async function callAdminApi(payload) {
    const response = await fetch(config.appsScriptUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({}, payload, { credential: googleCredential }))
    });
    if (!response.ok) throw new Error("Server returned " + response.status + ".");
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "The request was rejected.");
    return result;
  }

  function dateInputValue(value) {
    const date = getDateOnly(value);
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function timeInputValue(value) {
    if (!value) return "";
    const formatted = String(value).trim().toLowerCase();
    const parsed = parseTimeString(formatted);
    if (!parsed) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
    }
    return String(parsed.hour).padStart(2, "0") + ":" + String(parsed.minute).padStart(2, "0");
  }

  function statusClass(status) {
    return "status-" + String(status || "Scheduled").toLowerCase().replace(/[^a-z]+/g, "-");
  }

  function renderRows() {
    const query = els.adminSearch.value.trim().toLowerCase();
    const rows = adminRows.filter(function(row) {
      if (!query) return true;
      return [row["Sk Tech Register ID"], row["Full Name"], row.Round, row["Interview Date"], row.Status]
        .join(" ").toLowerCase().includes(query);
    });
    els.statusAdminBody.innerHTML = "";
    if (!rows.length) {
      els.statusAdminBody.innerHTML = '<tr><td colspan="8" class="empty-admin-state">No matching interviews found.</td></tr>';
      return;
    }
    rows.forEach(function(row) {
      const tr = document.createElement("tr");
      const currentStatus = row.Status || "Scheduled";
      const cells = [
        row["Sk Tech Register ID"] || "",
        row["Full Name"] || "",
        row.Round || "",
        formatDate(row["Interview Date"]),
        formatTimeRange(
          row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"],
          row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]
        ),
        row.Batch || ""
      ];
      cells.forEach(function(value) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      const statusTd = document.createElement("td");
      const pill = document.createElement("span");
      pill.className = "status-pill " + statusClass(currentStatus);
      pill.textContent = currentStatus;
      statusTd.appendChild(pill);
      if (row.Remarks) {
        const note = document.createElement("div");
        note.textContent = row.Remarks;
        note.title = row.Remarks;
        note.style.cssText = "max-width:220px;margin-top:6px;color:#9fb0c7;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
        statusTd.appendChild(note);
      }
      tr.appendChild(statusTd);

      const actionTd = document.createElement("td");
      const select = document.createElement("select");
      select.className = "status-select";
      select.setAttribute("aria-label", "Change status for " + (row["Sk Tech Register ID"] || "interview"));
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Choose status";
      select.appendChild(placeholder);
      statusApi.ALLOWED_STATUSES.forEach(function(status) {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        select.appendChild(option);
      });
      select.addEventListener("change", function() {
        if (!select.value) return;
        openStatusDialog(row, select.value);
        select.value = "";
      });
      actionTd.appendChild(select);
      tr.appendChild(actionTd);
      els.statusAdminBody.appendChild(tr);
    });
  }

  async function loadAdminInterviews(silent) {
    if (!googleCredential || requestInFlight) return;
    requestInFlight = true;
    if (!silent) setMessage("Loading interview and status data…");
    try {
      const result = await callAdminApi({ action: "listAdminInterviews" });
      adminRows = Array.isArray(result.data) ? sortByDateTime(result.data) : [];
      renderRows();
      setMessage("Updated " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), "success");
    } catch (error) {
      setMessage(error.message, "error");
      if (/authori|token|sign/i.test(error.message)) signOut();
    } finally {
      requestInFlight = false;
    }
  }

  function openStatusDialog(row, status) {
    selectedRow = row;
    selectedStatus = status;
    els.statusContext.textContent = (row["Sk Tech Register ID"] || "") + " • " + formatDate(row["Interview Date"]) + " • " + status;
    els.rescheduleFields.hidden = status !== "Rescheduled";
    els.remarksLabel.textContent = (status === "Cancelled" || status === "Other") ? "Reason / remarks (required)" : "Remarks (optional)";
    els.statusRemarks.value = "";
    els.rescheduledDate.value = dateInputValue(row["Interview Date"]);
    els.rescheduledFrom.value = timeInputValue(row["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"]);
    els.rescheduledTo.value = timeInputValue(row["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]);
    els.statusFormError.textContent = "";
    els.statusDialog.showModal();
  }

  async function saveStatus(event) {
    event.preventDefault();
    if (!selectedRow || !selectedStatus) return;
    const update = {
      action: "updateInterviewStatus",
      interviewKey: selectedRow.InterviewKey || statusApi.makeInterviewKey(selectedRow),
      registerId: selectedRow["Sk Tech Register ID"] || "",
      originalDate: selectedRow["Original Interview Date"] || selectedRow["Interview Date"] || "",
      originalFrom: selectedRow["Original Interview From"] || selectedRow["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"] || "",
      originalTo: selectedRow["Original Interview To"] || selectedRow["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"] || "",
      batch: selectedRow.Batch || "",
      status: selectedStatus,
      remarks: els.statusRemarks.value.trim(),
      rescheduledDate: els.rescheduledDate.value,
      rescheduledFrom: els.rescheduledFrom.value,
      rescheduledTo: els.rescheduledTo.value
    };
    const validation = statusApi.validateStatusUpdate(update);
    if (!validation.valid) {
      els.statusFormError.textContent = validation.errors[0];
      return;
    }
    if (!window.confirm("Change this interview to “" + selectedStatus + "”?")) return;
    els.saveStatusUpdate.disabled = true;
    els.saveStatusUpdate.textContent = "Saving…";
    els.statusFormError.textContent = "";
    try {
      await callAdminApi(update);
      els.statusDialog.close();
      setMessage("Status saved successfully. Refreshing dashboard data…", "success");
      await loadAdminInterviews(true);
    } catch (error) {
      els.statusFormError.textContent = error.message;
    } finally {
      els.saveStatusUpdate.disabled = false;
      els.saveStatusUpdate.textContent = "Save status";
    }
  }

  function handleCredential(response) {
    if (!response || !response.credential) return;
    googleCredential = response.credential;
    const profile = decodeGoogleCredential(googleCredential);
    els.adminUser.textContent = profile.email || "Google administrator";
    els.signInPanel.hidden = true;
    els.statusPanel.hidden = false;
    els.signOutButton.hidden = false;
    loadAdminInterviews(false);
    clearInterval(refreshTimer);
    refreshTimer = setInterval(function() { loadAdminInterviews(true); }, Math.max(15000, Number(config.refreshMilliseconds) || 30000));
  }

  function signOut() {
    googleCredential = "";
    adminRows = [];
    clearInterval(refreshTimer);
    els.statusPanel.hidden = true;
    els.signOutButton.hidden = true;
    els.signInPanel.hidden = false;
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
  }

  function initGoogleSignIn(attempt) {
    if (!config.googleClientId || config.googleClientId.indexOf("REPLACE_WITH") === 0) {
      els.setupMessage.textContent = "Setup required: add the Google OAuth Web Client ID in interview-admin-config.js.";
      els.setupMessage.className = "admin-message error";
      return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
      if (attempt < 30) setTimeout(function() { initGoogleSignIn(attempt + 1); }, 200);
      else {
        els.setupMessage.textContent = "Google Sign-In could not load. Check the connection and try again.";
        els.setupMessage.className = "admin-message error";
      }
      return;
    }
    google.accounts.id.initialize({ client_id: config.googleClientId, callback: handleCredential, auto_select: false });
    google.accounts.id.renderButton(byId("googleSignIn"), { theme: "filled_blue", size: "large", shape: "pill", text: "signin_with" });
  }

  document.addEventListener("DOMContentLoaded", function() {
    ["signInPanel", "statusPanel", "signOutButton", "adminUser", "adminSearch", "refreshAdmin", "adminMessage", "statusAdminBody", "statusDialog", "statusForm", "statusContext", "rescheduleFields", "rescheduledDate", "rescheduledFrom", "rescheduledTo", "remarksLabel", "statusRemarks", "statusFormError", "cancelStatusUpdate", "saveStatusUpdate"].forEach(function(id) { els[id] = byId(id); });
    els.adminSearch.addEventListener("input", renderRows);
    els.refreshAdmin.addEventListener("click", function() { loadAdminInterviews(false); });
    els.signOutButton.addEventListener("click", signOut);
    els.cancelStatusUpdate.addEventListener("click", function() { els.statusDialog.close(); });
    els.statusForm.addEventListener("submit", saveStatus);
    initGoogleSignIn(0);
  });
})();
