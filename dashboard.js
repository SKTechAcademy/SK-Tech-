const API_URL = "https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";

let allData = [];

// Format Date
function formatDate(val) {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-IN");
}

// Format Time
function formatTime(val) {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

// Render Table
function renderTable(data) {

    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    for (let i = 0; i < data.length; i++) {

        let item = data[i];

        let row = "<tr>";

        row += "<td>" + (item["Sk Tech Register ID"] || "") + "</td>";
        row += "<td>" + (item["Full Name"] || "") + "</td>";
        row += "<td>" + (item["Round"] || "") + "</td>";
        row += "<td>" + (item[" Technologies Required"] || "") + "</td>";
        row += "<td>" + (item["Interview Company "] || "") + "</td>";
        row += "<td>" + formatDate(item["Interview Date"]) + "</td>";
        row += "<td>" + formatTime(item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"]) + "</td>";
        row += "<td>" + formatTime(item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]) + "</td>";
        row += "<td>" + (item["Batch"] || "") + "</td>";

        row += "</tr>";

        table.innerHTML += row;
    }
}

// Load Data (NO async/await → no errors)
function loadData() {

    fetch(API_URL)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        console.log("DATA:", data);

        allData = data;

        document.getElementById("totalCount").innerText = data.length;
        document.getElementById("todayCount").innerText = data.length;

        renderTable(data);

    })
    .catch(function(error) {
        console.error("ERROR:", error);
    });
}

// Search
document.getElementById("searchInput")
.addEventListener("keyup", function() {

    let val = this.value.toLowerCase();

    let filtered = [];

    for (let i = 0; i < allData.length; i++) {

        let item = allData[i];

        let name = (item["Full Name"] || "").toLowerCase();
        let company = (item["Interview Company "] || "").toLowerCase();
        let tech = (item[" Technologies Required"] || "").toLowerCase();
        let id = (item["Sk Tech Register ID"] || "").toLowerCase();

        if (
            name.includes(val) ||
            company.includes(val) ||
            tech.includes(val) ||
            id.includes(val)
        ) {
            filtered.push(item);
        }
    }

    renderTable(filtered);
});

// Init
loadData();
setInterval(loadData, 60000);
