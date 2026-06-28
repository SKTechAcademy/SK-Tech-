// dashboard.js
// Public interview dashboard for SK Tech Academy.

function renderTable(data) {
  const table = document.getElementById("tableBody");
  table.innerHTML = "";

  if (data.length === 0) {
    showEmpty("tableBody", "No interviews found for this tab.", 6);
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const obj = data[i];
    const item = obj.item || obj;
    const rowClass = obj.rowClass || "";
    
    let row = "<tr";
    if (rowClass) {
      row += " class=\"" + rowClass + "\"";
    }
    
    // Apply definitive inline styles for booked rows - CANNOT BE OVERRIDDEN
    if (rowClass && rowClass.includes('booked-row')) {
      row += " style='background-color: #dc2626 !important; background: #dc2626 !important; border: 4px solid #b91c1c !important; box-shadow: inset 0 0 0 1000px #dc2626 !important;'";
    }
    row += ">";

    // Apply cell-level styling for booked rows
    const cellStyle = (rowClass && rowClass.includes('booked-row')) ? 
      "style='color: #ffffff !important; font-weight: bold !important; background: transparent !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;'" : "";

    // Add red indicator for booked rows
    const idContent = escapeHtml(item["Sk Tech Register ID"] || "");
    const bookedIndicator = (rowClass && rowClass.includes('booked-row')) ? "🔴 BOOKED - " : "";
    
    row += "<td " + cellStyle + ">" + bookedIndicator + idContent + "</td>";
    row += "<td " + cellStyle + ">" + escapeHtml(item["Round"] || "") + "</td>";
    row += "<td " + cellStyle + ">" + escapeHtml(formatDate(item["Interview Date"])) + "</td>";
    row += "<td " + cellStyle + ">" + escapeHtml(formatTime(item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"])) + "</td>";
    row += "<td " + cellStyle + ">" + escapeHtml(formatTime(item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"])) + "</td>";
    row += "<td " + cellStyle + ">" + escapeHtml(item["Batch"] || "") + "</td>";

    row += "</tr>";
    table.innerHTML += row;
  }

  // Immediate DOM manipulation after rendering
  setTimeout(function() {
    const bookedRows = document.querySelectorAll('tr.booked-row');
    bookedRows.forEach(function(row) {
      row.setAttribute('style', 'background-color: #dc2626 !important; background: #dc2626 !important; border: 4px solid #b91c1c !important; box-shadow: inset 0 0 0 1000px #dc2626 !important;');
      const cells = row.querySelectorAll('td');
      cells.forEach(function(cell) {
        cell.setAttribute('style', 'color: #ffffff !important; font-weight: bold !important; background: transparent !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;');
      });
    });
  }, 10);
}

function classifyRows(upcoming) {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const conflictIndices = findConflicts(upcoming);

  const rows = [];
  for (let i = 0; i < upcoming.length; i++) {
    const itm = upcoming[i];
    const dateOnly = getDateOnly(itm["Interview Date"]);
    let rowClass = "";
    if (conflictIndices.has(i)) {
      rowClass = "conflict-row";
    } else if (dateOnly && dateOnly.getTime() === today.getTime()) {
      rowClass = "today-row";
    } else if (dateOnly && dateOnly.getTime() === tomorrow.getTime()) {
      rowClass = "tomorrow-row";
    } else {
      rowClass = "future-row";
    }
    rows.push({ item: itm, rowClass: rowClass, dateOnly: dateOnly });
  }
  return rows;
}

const OPEN_MINUTES = 7 * 60; // 7:00 AM
const CLOSE_MINUTES = 24 * 60; // 12:00 AM (midnight)
const SLOT_MINUTES = 60;

function minutesToTimeStr(minutes) {
  if (minutes === 24 * 60) return "12:00 am";
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function createAvailableSlot(dateObj, startMinutes, endMinutes, isToday) {
  return {
    item: {
      "Sk Tech Register ID": "Available",
      "Round": "",
      "Interview Date": dateObj,
      "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment": minutesToTimeStr(startMinutes),
      "Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment": minutesToTimeStr(endMinutes),
      "Batch": ""
    },
    rowClass: isToday ? "today-available-row" : "future-available-row",
    dateOnly: dateObj
  };
}

function createBookedSlot(dateObj, startMinutes, endMinutes, item) {
  return {
    item: {
      "Sk Tech Register ID": item["Sk Tech Register ID"] || "Booked",
      "Round": item["Round"] || "",
      "Interview Date": dateObj,
      "Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment": minutesToTimeStr(startMinutes),
      "Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment": minutesToTimeStr(endMinutes),
      "Batch": item["Batch"] || ""
    },
    rowClass: "booked-row",
    dateOnly: dateObj
  };
}

function getAvailableSlots(upcoming, daysToShow) {
  const slots = [];
  const today = getToday();
  const bookedSlots = upcoming.filter(function(item) {
    return (item["Sk Tech Register ID"] || "").toString().trim();
  });
  const dates = [];

  // Build list of dates: today + next daysToShow-1 days, plus any dates from data
  const dateSet = new Set();
  for (let i = 0; i < (daysToShow || 5); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateSet.add(d.getTime());
  }
  upcoming.forEach(function(item) {
    const dateOnly = getDateOnly(item["Interview Date"]);
    if (dateOnly) dateSet.add(dateOnly.getTime());
  });
  dateSet.forEach(function(t) { dates.push(new Date(t)); });
  dates.sort(function(a, b) { return a.getTime() - b.getTime(); });

  dates.forEach(function(dateObj) {
    const dateTime = dateObj.getTime();
    const isToday = dateTime === today.getTime();

    // Get booked slots for this date, sorted by start time
    const dayBooked = bookedSlots
      .map(function(item) {
        return {
          item: item,
          start: toMinutes(item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"]),
          end: toMinutes(item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"])
        };
      })
      .filter(function(slot) {
        const itemDate = getDateOnly(slot.item["Interview Date"]);
        return itemDate && itemDate.getTime() === dateTime && slot.start > 0 && slot.end > 0;
      })
      .sort(function(a, b) { return a.start - b.start; });

    // Merge overlapping/adjacent booked slots
    const merged = [];
    dayBooked.forEach(function(slot) {
      if (merged.length === 0) {
        merged.push(slot);
      } else {
        const last = merged[merged.length - 1];
        if (slot.start <= last.end) {
          last.end = Math.max(last.end, slot.end);
        } else {
          merged.push(slot);
        }
      }
    });

    // Generate free 1-hour slots and booked slot rows between operating hours
    let current = OPEN_MINUTES;
    merged.forEach(function(slot) {
      while (current + SLOT_MINUTES <= slot.start) {
        slots.push(createAvailableSlot(dateObj, current, current + SLOT_MINUTES, isToday));
        current += SLOT_MINUTES;
      }
      // Show the booked slot row itself in red
      const bookedStart = Math.max(slot.start, OPEN_MINUTES);
      const bookedEnd = Math.min(slot.end, CLOSE_MINUTES);
      if (bookedStart < bookedEnd) {
        slots.push(createBookedSlot(dateObj, bookedStart, bookedEnd, slot.item));
      }
      if (current < slot.end) {
        current = slot.end;
      }
    });
    while (current + SLOT_MINUTES <= CLOSE_MINUTES) {
      slots.push(createAvailableSlot(dateObj, current, current + SLOT_MINUTES, isToday));
      current += SLOT_MINUTES;
    }
  });

  return slots;
}

function filterByTab(rows, tab, upcoming, daysToShow) {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (tab === "today") {
    return rows.filter(function(r) { return r.dateOnly && r.dateOnly.getTime() === today.getTime(); });
  }
  if (tab === "tomorrow") {
    return rows.filter(function(r) { return r.dateOnly && r.dateOnly.getTime() === tomorrow.getTime(); });
  }
  if (tab === "available") {
    return getAvailableSlots(upcoming, daysToShow || 2);
  }
  return rows;
}

function loadData() {
  showLoading("tableBody", 6);

  fetch(API_URL)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from server");
      }

      let { upcoming, todayCount } = filterUpcoming(data);
      upcoming = sortByDateTime(upcoming);
      const allRows = classifyRows(upcoming);

      setText("totalCount", upcoming.length);
      setText("todayCount", todayCount);

      const activeBtn = document.querySelector(".tab-btn.active");
      const activeTab = activeBtn ? activeBtn.getAttribute("data-tab") : "all";
      const filteredRows = filterByTab(allRows, activeTab, upcoming, 5);
      renderTable(filteredRows);
    })
    .catch(function(error) {
      console.error("ERROR:", error);
      showError("tableBody", "Failed to load data: " + error.message, 6);
    });
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(function(btn) {
    btn.addEventListener("click", function() {
      tabs.forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      loadData();
    });
  });
}

loadData();
initTabs();
setInterval(loadData, 60000);
