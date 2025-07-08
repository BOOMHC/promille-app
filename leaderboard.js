import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.appspot.com",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const leaderboardBody = document.getElementById("leaderboardBody");

// Score speichern
window.autoSubmitScore = () => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const name = user.username;
  const promille = parseFloat(document.getElementById("promille").innerText);
  if (!name || isNaN(promille)) return;
  const scoresRef = ref(db, "scores");
  push(scoresRef, { name, score: promille });
  console.log("Automatisch Score gespeichert:", name, promille);
};
export function autoSubmitScore() {
  // Firebase-Code zum Speichern
}


// Sichtbarkeit toggeln
window.toggleLeaderboard = () => {
  const sec = document.getElementById("leaderboardSection");
  sec.style.display = sec.style.display === "none" ? "block" : "none";
};

// Live-Update
const scoresRef = ref(db, "scores");
const topScoresQuery = query(scoresRef, orderByChild("score"), limitToLast(10));

onValue(topScoresQuery, (snapshot) => {
  const scores = [];
  snapshot.forEach(childSnap => scores.push(childSnap.val()));
  scores.sort((a, b) => b.score - a.score);

  leaderboardBody.innerHTML = "";
  scores.forEach((entry, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score.toFixed(2)}‰</td>`;
    leaderboardBody.appendChild(row);
  });
});