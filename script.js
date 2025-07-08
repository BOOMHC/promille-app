// Inhalte aus Speicher laden
let userData = {};
let drinks = [];

const drinksData = [
  { type: "bier", name: "Bier", img: "images/bier.png", amount: 0.33, alc: 5.3 },
  { type: "wein", name: "Wein", img: "images/wein.png", amount: 0.2, alc: 14.0 },
  { type: "kabull", name: "Kabull", img: "images/kabull.png", amount: 0.3, alc: 12.0 },
  { type: "monte", name: "Monte", img: "images/monte.png", amount: 0.1, alc: 23.0 },
  { type: "shot", name: "Shot", img: "images/shot.png", amount: 0.04, alc: 30.0 },
  { type: "veneziano", name: "Veneziano", img: "images/veneziano.png", amount: 0.4, alc: 10.0 }
];

let currentDrinkIndex = 0;

// === Funktionen ===

function updateDrinkLabels() {
  document.getElementById("amountLabel").innerText = parseFloat(document.getElementById("amount").value).toFixed(2);
  document.getElementById("alcLabel").innerText = parseFloat(document.getElementById("alcohol").value).toFixed(1);
}

function updateDrinkUI() {
  const drink = drinksData[currentDrinkIndex];
  const img = document.getElementById("drinkImage");
  img.src = drink.img;
  img.alt = drink.name;

  document.getElementById("amount").value = drink.amount;
  document.getElementById("alcohol").value = drink.alc;

  updateDrinkLabels();
}

function getTrinkzeitByMenge(menge) {
  return menge * 30 * 60 * 1000;
}

function calculatePromille() {
  if (!userData.weight || !userData.gender) return 0;

  const r = userData.gender === "male" ? 0.68 : 0.55;
  const now = Date.now();

  const abbauRate = userData.gender === "male" ? 0.12 : 0.10;
  const abbauGrammProStd = abbauRate * userData.weight * r;

  let aufgenommen = 0;
  let abgebaut = 0;

  for (const drink of drinks) {
    const dauer = drink.timeEnd - drink.timeStart;
    const absorbiert = Math.min(1, Math.max(0, (now - drink.timeStart) / dauer));
    const alk = drink.grams * absorbiert;

    aufgenommen += alk;

    if (absorbiert > 0.2) {
      const abbauStart = drink.timeStart + dauer * 0.2;
      const abbauZeit = Math.max(0, now - abbauStart) / 3600000;
      abgebaut += Math.min(alk, abbauGrammProStd * abbauZeit);
    }
  }

  const netto = Math.max(0, aufgenommen - abgebaut);
  return (netto / (userData.weight * r)).toFixed(2);
}

function updatePromille() {
  const promille = calculatePromille();
  const promilleSpan = document.getElementById("promille");
  promilleSpan.innerText = promille;
  const val = parseFloat(promille);
  promilleSpan.style.color = val >= 1.5 ? "green" : val <= 0.1 ? "red" : "orange";
}

function addDrink() {
  const now = Date.now();
  const amount = parseFloat(document.getElementById("amount").value);
  const alcVol = parseFloat(document.getElementById("alcohol").value);
  const type = drinksData[currentDrinkIndex].type;

  const ml = amount * 1000 * (alcVol / 100);
  const grams = ml * 0.789;

  drinks.push({
    type,
    grams,
    timeStart: now,
    timeEnd: now + getTrinkzeitByMenge(amount)
  });

  localStorage.setItem("drinks", JSON.stringify(drinks));
  updatePromille();

  const btn = document.getElementById("addDrinkBtn");
  btn.disabled = true;
  setTimeout(() => btn.disabled = false, 1000);
}

function loginAndSaveUser() {
  const username = document.getElementById("username").value.trim();
  const weight = parseFloat(document.getElementById("weight").value);
  const gender = document.getElementById("gender").value;

  if (!username || isNaN(weight) || weight <= 0) {
    alert("Bitte gültigen Namen und Gewicht eingeben.");
    return;
  }

  userData = { username, weight, gender };
  localStorage.setItem("userData", JSON.stringify(userData));

  document.getElementById("setup").style.display = "none";
  document.getElementById("drinks").style.display = "block";
  document.getElementById("status").style.display = "block";

  drinks = JSON.parse(localStorage.getItem("drinks") || "[]");
  updatePromille();
  updateDrinkUI();
}

function startPromilleBerechnung() {
  loginAndSaveUser();
}

function resetApp() {
  if (confirm("Zurücksetzen?")) {
    localStorage.clear();
    location.reload();
  }
}

// Swipe
let startX = 0, isDragging = false;
const img = document.getElementById("drinkImage");

img.addEventListener("pointerdown", (e) => {
  isDragging = true;
  startX = e.clientX;
  img.style.transition = "none";
});

img.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  img.style.transform = `translateX(${dx}px)`;
});

img.addEventListener("pointerup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  img.style.transition = "transform 0.3s ease";

  const dx = e.clientX - startX;
  if (dx > 50) currentDrinkIndex = (currentDrinkIndex - 1 + drinksData.length) % drinksData.length;
  else if (dx < -50) currentDrinkIndex = (currentDrinkIndex + 1) % drinksData.length;

  updateDrinkUI();
  img.style.transform = "translateX(0)";
});

img.addEventListener("pointercancel", () => {
  isDragging = false;
  img.style.transform = "translateX(0)";
});


window.onload = () => {
  const saved = localStorage.getItem("userData");
  if (saved) {
    userData = JSON.parse(saved);
    document.getElementById("username").value = userData.username;
    document.getElementById("weight").value = userData.weight;
    document.getElementById("gender").value = userData.gender;

    document.getElementById("setup").style.display = "none";
    document.getElementById("drinks").style.display = "block";
    document.getElementById("status").style.display = "block";
  }

  drinks = JSON.parse(localStorage.getItem("drinks") || "[]");

  updateDrinkUI();
  updatePromille();

  // Alle 10 Sekunden Promille und Score aktualisieren
  setInterval(updatePromille, 10000);
};
