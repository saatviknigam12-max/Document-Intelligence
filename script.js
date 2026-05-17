window.onload = loadHistory;

const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");

// File preview + info
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  fileInfo.innerHTML = `
    📄 ${file.name}<br>
    📦 ${(file.size / 1024).toFixed(2)} KB<br>
    🧾 ${file.type}
  `;

  // Image preview
  if (file.type.startsWith("image")) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
});

// Analyze
async function analyze() {
  const endpoint = document.getElementById("endpoint").value;
  const apiKey = document.getElementById("apiKey").value;
  const file = fileInput.files[0];
  const resultBox = document.getElementById("result");

  if (!endpoint || !apiKey || !file) {
    alert("Fill all fields!");
    return;
  }

  resultBox.textContent = "Processing...";

  try {
    const response = await fetch(
      `${endpoint}/formrecognizer/documentModels/prebuilt-document:analyze?api-version=2023-07-31`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": file.type
        },
        body: file
      }
    );

    const op = response.headers.get("operation-location");

    let result;
    while (true) {
      const res = await fetch(op, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey
        }
      });

      result = await res.json();

      if (result.status === "succeeded") break;
      await new Promise(r => setTimeout(r, 2000));
    }

    const text = result.analyzeResult.content;
    resultBox.textContent = text;

    saveHistory(text);

  } catch (err) {
    resultBox.textContent = "Error: " + err.message;
  }
}

/* HISTORY */

function saveHistory(text) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.unshift({
    text,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const list = document.getElementById("historyList");

  list.innerHTML = history.map((item, i) => `
    <li onclick="viewHistory(${i})">${item.date}</li>
  `).join("");
}

function viewHistory(i) {
  const history = JSON.parse(localStorage.getItem("history"));
  document.getElementById("result").textContent = history[i].text;
}

/* SEARCH */
function searchHistory() {
  const query = document.getElementById("search").value.toLowerCase();
  const history = JSON.parse(localStorage.getItem("history")) || [];

  const filtered = history.filter(h => h.text.toLowerCase().includes(query));

  historyList.innerHTML = filtered.map((item, i) => `
    <li onclick="viewHistory(${i})">${item.date}</li>
  `).join("");
}

/* CLEAR */
function clearHistory() {
  localStorage.removeItem("history");
  loadHistory();
}