const API_URL = "https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";

let allData = [];

function formatDate(val) {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-IN");
}

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

function renderTable(data) {

    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    data.forEach(function(item) {

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
    });
}

async function loadData() {

    try {

        const response = await fetch(API_URL);
        const data = await response.json();

        console.log("DATA:", data);

        allData = data;

        document.getElementById("totalCount").innerText = data.length;

        renderTable(data);

    } catch (e) {
        console.error(e);
    }
}

document.getElementById("searchInput")
.addEventListener("keyup", function() {

    const val = this.value.toLowerCase();

    const filtered = allData.filter(item =>
        (item["Full Name"] || "").toLowerCase().includes(val) ||
        (item["Interview Company "] || "").toLowerCase().includes(val) ||
        (item[" Technologies Required"] || "").toLowerCase().includes(val) ||
        (item["Sk Tech Register ID"] || "").toLowerCase().includes(val)
    );

    renderTable(filtered);
});

loadData();
setInterval(loadData, 60000);
