const firebaseConfig = {
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.appspot.com",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

window.autoSubmitScore = function() {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const name = user.username;
  const promille = parseFloat(document.getElementById("promille").innerText);
  if (!name || isNaN(promille)) return;
  const scoresRef = db.ref("scores");
  scoresRef.push({ name, score: promille });
  console.log("Automatisch gespeichert:", name, promille);
};

window.toggleLeaderboard = function() {
  const sec = document.getElementById("leaderboardSection");
  sec.style.display = sec.style.display === "none" ? "block" : "none";
};

function updateLeaderboard() {
  const scoresRef = db.ref("scores").orderByChild("score").limitToLast(10);

  scoresRef.on("value", (snapshot) => {
    const scores = [];
    snapshot.forEach((childSnap) => scores.push(childSnap.val()));
    scores.sort((a, b) => b.score - a.score);

    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML = "";
    scores.forEach((entry, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score.toFixed(2)}‰</td>`;
      leaderboardBody.appendChild(row);
    });
  });
}

updateLeaderboard();
