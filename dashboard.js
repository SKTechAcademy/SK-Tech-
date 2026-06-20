const API_URL =
"https://script.google.com/macros/s/AKfycbwxpMoYA7gmul9iMk9eA2Cae07sxynCp6Ff73BhXFAdJoOMBmNzZP2-5ck2qRyqjm7W/exec";

async function loadData() {

try {

```
const response = await fetch(API_URL);
const data = await response.json();

console.log("FULL DATA:", data);
console.log("FIRST RECORD:", data[0]);

document.getElementById("totalCount").innerText = data.length;

let table = document.getElementById("tableBody");
table.innerHTML = "";

data.forEach(item => {

  table.innerHTML += `
  <tr>
    <td>${item["Sk Tech Register ID"] || ""}</td>
    <td>${item["Full Name"] || ""}</td>
    <td>${item["Round"] || ""}</td>
    <td>${item[" Technologies Required"] || item["Technologies Required"] || ""}</td>
    <td>${item["Interview Company "] || item["Interview Company"] || ""}</td>
    <td>${item["Interview Date"] || ""}</td>
    <td>${item["Interview Time (From)  or  If Time Not confirmed plz select 00:00 like Assessment"] || ""}</td>
    <td>${item["Interview Time (To) or  If Time Not confirmed plz select 00:00 like Assessment"] || ""}</td>
    <td>${item["Batch"] || ""}</td>
  </tr>`;
});
```

} catch (error) {
console.error("ERROR:", error);
}
}

loadData();
setInterval(loadData, 30000);
