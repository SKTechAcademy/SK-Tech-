const API_URL =
"https://script.google.com/macros/s/AKfycbzzML8wx7lF_0caPkVZVsLgpHvPX1brwcgWPW8Pg8t4EwYzUQHsMmB_R8AJdDSjA3t1RA/exec";

async function loadInterviews() {

    const response = await fetch(API_URL);
    const data = await response.json();

    const table =
    document.getElementById("tableBody");

    table.innerHTML = "";

    data.forEach(item => {

        table.innerHTML += `
        <tr>
            <td>${item["Sk Tech Register ID"]}</td>
            <td>${item["Full Name"]}</td>
            <td>${item["Technologies Required"]}</td>
            <td>${item["Interview Company"]}</td>
            <td>${item["Interview Date"]}</td>
            <td>${item["Interview Time (From)"]}</td>
            <td>${item["Interview Time (To)"]}</td>
        </tr>`;
    });
}

loadInterviews();

setInterval(loadInterviews,30000);
