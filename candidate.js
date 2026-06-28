// candidate.js
// Renders the candidate dashboard with personal booked slots and all available slots.

function getCandidateId() {
  const user = window.__currentUser || {};
  return (user.registerId || localStorage.getItem("registerId") || "").toString().trim();
}

function renderSlotRow(slot, statusClass, statusText) {
  const tr = document.createElement("tr");
  tr.innerHTML =
    "<td>" + escapeHtml(slot.registerId) + "</td>" +
    "<td>" + escapeHtml(slot.technology) + "</td>" +
    "<td>" + escapeHtml(slot.date) + "</td>" +
    "<td>" + escapeHtml(slot.timeSlot) + "</td>" +
    "<td class=\"" + statusClass + "\">" + escapeHtml(statusText) + "</td>";
  return tr;
}

function loadCandidateData() {
  const registerId = getCandidateId();
  if (!registerId) {
    showError("bookedBody", "User register ID not found. Please log in again.", 5);
    showError("availableBody", "User register ID not found. Please log in again.", 5);
    return;
  }

  setText("candidateRegisterId", registerId);
  showLoading("bookedBody", 5);
  showLoading("availableBody", 5);

  fetch(API_URL)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server");
      }

      let { upcoming } = filterUpcoming(data);
      upcoming = sortByDateTime(upcoming);

      const myBooked = [];
      const available = [];
      let myTodayCount = 0;
      const today = getToday();

      upcoming.forEach(function(item) {
        const regId = (item["Sk Tech Register ID"] || "").toString().trim();
        const tech = (item[" Technologies Required"] || "").trim();
        const dateVal = item["Interview Date"];
        const timeSlot = formatTimeRange(
          item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"],
          item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]
        );
        const dateOnly = getDateOnly(dateVal);

        const slot = {
          registerId: regId || "Available",
          technology: tech,
          date: formatDate(dateVal),
          timeSlot: timeSlot
        };

        if (regId && regId.toLowerCase() === registerId.toLowerCase()) {
          myBooked.push(slot);
          if (dateOnly && dateOnly.getTime() === today.getTime()) {
            myTodayCount++;
          }
        } else if (!regId) {
          available.push(slot);
        }
      });

      const bookedBody = document.getElementById("bookedBody");
      const availableBody = document.getElementById("availableBody");
      bookedBody.innerHTML = "";
      availableBody.innerHTML = "";

      if (myBooked.length === 0) {
        showEmpty("bookedBody", "You have no booked interview slots.", 5);
      } else {
        myBooked.forEach(function(slot) {
          bookedBody.appendChild(renderSlotRow(slot, "status-booked", "\uD83D\uDD34 Booked"));
        });
      }

      if (available.length === 0) {
        showEmpty("availableBody", "No available slots at the moment.", 5);
      } else {
        available.forEach(function(slot) {
          availableBody.appendChild(renderSlotRow(slot, "status-available", "\uD83D\uDFE2 Available"));
        });
      }

      setText("todayCount", myTodayCount);
      setText("availableCount", available.length);
      setText("bookedCount", myBooked.length);
    })
    .catch(function(err) {
      console.error("Error loading candidate data:", err);
      showError("bookedBody", "Failed to load data: " + err.message, 5);
      showError("availableBody", "Failed to load data: " + err.message, 5);
    });
}

document.addEventListener("DOMContentLoaded", function() {
  loadCandidateData();
  setInterval(loadCandidateData, 60000);
});
