const API_URL =
"https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";

let allData = [];

function formatDate(dateValue) {

```
if (!dateValue) return "";

try {

    const date = new Date(dateValue);

    if (isNaN(date)) return dateValue;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

} catch {
    return dateValue;
}
```

}

function formatTime(timeValue) {

```
if (!timeValue) return "";

try {

    const date = new Date(timeValue);

    if (isNaN(date)) return timeValue;

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

} catch {
    return timeValue;
}
```

}

function renderTable(data) {

```
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
```

}

```

}

async function loadData() {

```
try {

    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("API DATA:", data);

    allData = data;

    document.getElementById("totalCount").innerText =
        data.length;

    document.getElementById("todayCount").innerText =
        data.length;

    renderTable(data);

} catch(error) {

    console.error("ERROR:", error);

}
```

}

document.getElementById("searchInput")
.addEventListener("keyup", function() {

```
const value = this.value.toLowerCase();

const filtered = allData.filter(item => {

    return (

        (item["Full Name"] || "")
        .toLowerCase()
        .includes(value)

        ||

        (item["Interview Company "] || "")
        .toLowerCase()
        .includes(value)

        ||

        (item[" Technologies Required"] || "")
        .toLowerCase()
        .includes(value)

        ||

        (item["Sk Tech Register ID"] || "")
        .toLowerCase()
        .includes(value)

    );

});

renderTable(filtered);
```

});

loadData();

setInterval(loadData, 60000);
