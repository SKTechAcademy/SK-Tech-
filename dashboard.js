const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzzML8wx7lF_0caPkVZVsLgpHvPX1brwcgWPW8Pg8t4EwYzUQHsMmB_R8AJdDSjA3t1RA/exec?callback=loadData";

const script = document.createElement("script");
script.src = SCRIPT_URL;
document.body.appendChild(script);

function loadData(data){

```
console.log(data);

document.getElementById("totalCount").innerText =
data.length;

let table =
document.getElementById("tableBody");

table.innerHTML = "";

data.forEach(item => {

    table.innerHTML += `
    <tr>
        <td>${item["Sk Tech Register ID"]}</td>
        <td>${item["Full Name"]}</td>
        <td>${item["Round"]}</td>
        <td>${item["Technologies Required"]}</td>
        <td>${item["Interview Company"]}</td>
        <td>${item["Interview Date"]}</td>
        <td>${item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"]}</td>
        <td>${item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"]}</td>
        <td>${item["Batch"]}</td>
    </tr>
    `;
});
```

}
