// admin.js
// Populates the admin dashboard with detailed interview information.

function loadAdminData() {
  showLoading("adminBody", 9);

  fetch(API_URL)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server");
      }

      const today = getToday();
      let { upcoming, todayCount } = filterUpcoming(data);
      upcoming = sortByDateTime(upcoming);
      const conflictIndices = findConflicts(upcoming);

      setText("todayCountAdmin", todayCount);
      setText("totalUpcomingAdmin", upcoming.length);

      const tbody = document.getElementById("adminBody");
      tbody.innerHTML = "";

      if (upcoming.length === 0) {
        showEmpty("adminBody", "No upcoming interviews found.", 9);
        return;
      }

      upcoming.forEach(function(item, idx) {
        const regId = item["Sk Tech Register ID"] || "";
        const fullName = item["Full Name"] || "";
        const round = item["Round"] || "";
        const tech = item[" Technologies Required"] || "";
        const company = item["Company"] || "";
        const dateVal = item["Interview Date"];
        const dateStr = formatDate(dateVal);
        const timeSlot = formatTimeRange(
          item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"],
          item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]
        );
        const batch = item["Batch"] || "";

        const dateOnly = getDateOnly(dateVal);
        let statusClass = "status-future";
        let statusText = "Upcoming";
        if (conflictIndices.has(idx)) {
          statusClass = "status-conflict";
          statusText = "Conflict";
        } else if (dateOnly && dateOnly.getTime() === today.getTime()) {
          statusClass = "status-today";
          statusText = "Today";
        }

        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + escapeHtml(regId) + "</td>" +
          "<td>" + escapeHtml(fullName) + "</td>" +
          "<td>" + escapeHtml(round) + "</td>" +
          "<td>" + escapeHtml(tech) + "</td>" +
          "<td>" + escapeHtml(company) + "</td>" +
          "<td>" + escapeHtml(dateStr) + "</td>" +
          "<td>" + escapeHtml(timeSlot) + "</td>" +
          "<td>" + escapeHtml(batch) + "</td>" +
          "<td class=\"" + statusClass + "\">" + escapeHtml(statusText) + "</td>";
        tbody.appendChild(tr);
      });
    })
    .catch(function(err) {
      console.error("Error loading admin data:", err);
      showError("adminBody", "Failed to load data: " + err.message, 9);
    });
}

document.addEventListener("DOMContentLoaded", function() {
  loadAdminData();
  setInterval(loadAdminData, 60000);
});