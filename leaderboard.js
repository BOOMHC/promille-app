// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.appspot.com",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Hilfsfunktion: ungültige Zeichen in Firebase-Schlüssel ersetzen
function sanitizeKey(name) {
  return name.replace(/[.#$/\[\]]/g, "_");
}

// Score speichern/überschreiben
function autoSubmitScore() {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const name = user.username;
  const promilleText = document.getElementById("promille")?.innerText || "0";
  const promille = parseFloat(promilleText);

  if (!name || isNaN(promille)) return;

  const safeName = sanitizeKey(name);
  const userScoreRef = db.ref("scores/" + safeName);

  userScoreRef.set({ name, score: promille });
  console.log("Gespeichert:", name, promille);
}

// Leaderboard aktualisieren
function updateLeaderboard() {
  const scoresRef = db.ref("scores").orderByChild("score").limitToLast(10);

  scoresRef.once("value", snapshot => {
    const scores = [];
    snapshot.forEach(child => scores.push(child.val()));
    scores.sort((a, b) => b.score - a.score);

    const tbody = document.getElementById("leaderboardBody");
    if (tbody) {
      tbody.innerHTML = "";
      scores.forEach((entry, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score.toFixed(2)}‰</td>`;
        tbody.appendChild(row);
      });
    }

    // Top 4 extra anzeigen
    const top4Section = document.getElementById("top4Section");
    if (top4Section) {
      top4Section.innerHTML = scores.slice(0, 4).map((e, i) =>
        `${i + 1}. ${e.name}: ${e.score.toFixed(2)}‰`
      ).join("<br>");
    }
  });
}

// Initiales Laden
updateLeaderboard();

// Automatisches Aktualisieren alle 10 Sekunden
setInterval(() => {
  autoSubmitScore();
  updateLeaderboard();
}, 10000);
