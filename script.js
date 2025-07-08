// Basis-Parameter
let userData = {};
let drinks = [];
// Beispiel-Daten für Drinks mit Bild-URLs, Standardmenge und Alkohol
import { autoSubmitScore } from './leaderboard.js';

window.onload = () => {
  // ... anderer Code ...

  setInterval(autoSubmitScore, 60000);
};

const drinksData = [
  { type: "bier", name: "Bier", img: "images/bier.png", amount: 0.33, alc: 5.3 },
  { type: "wein", name: "Wein", img: "images/wein.png", amount: 0.2, alc: 14.0 },
  { type: "kabull", name: "Kabull", img: "images/kabull.png", amount: 0.3, alc:12.0 },
  { type: "monte", name: "Monte", img: "images/monte.png", amount: 0.1, alc: 23.0 },
  { type: "shot", name: "Shot", img: "images/shot.png", amount: 0.04, alc: 30.0 },
  { type: "veneziano", name: "Veneziano", img: "images/veneziano.png", amount: 0.4, alc: 10.0 }
];

let currentDrinkIndex = 0;

// Funktion: Trinkzeit abhängig von Menge (Liter)
// Beispiel: 0.33L → 10min, linear skaliert (30min pro Liter)
function getTrinkzeitByMenge(menge) {
  return menge * 30 * 60 * 1000; // ms
}

// Login und Speicherung der Nutzerdaten
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

// Getränk hinzufügen
function addDrink() {
  const now = Date.now();
  const amount = parseFloat(document.getElementById("amount").value); // Liter
  const alcVol = parseFloat(document.getElementById("alcohol").value); // Vol.-%
  const type = drinksData[currentDrinkIndex].type;

  const alcoholMl = amount * 1000 * (alcVol / 100);
  const density = 0.789; // g/ml
  const alcoholGrams = alcoholMl * density;

  if (!alcoholGrams || alcoholGrams <= 0) {
    alert("Ungültige Eingabe");
    return;
  }

  const trinkzeit = getTrinkzeitByMenge(amount);

  drinks.push({
    type,
    grams: alcoholGrams,
    timeStart: now,
    timeEnd: now + trinkzeit
  });

  localStorage.setItem("drinks", JSON.stringify(drinks));
  updatePromille();

  // Cooldown: Button kurz deaktivieren, damit nicht doppelt gedrückt wird
  const btn = document.querySelector("#drinks button");
  btn.disabled = true;
  setTimeout(() => {
    btn.disabled = false;
  }, 1000);
}

// Promille berechnen (mit realistischem Abbaubeginn)
function calculatePromille() {
  if (!userData.weight || !userData.gender) return 0;

  const r = userData.gender === "male" ? 0.68 : 0.55;
  const now = Date.now();

  // Geschlechtsabhängiger Abbauwert in ‰/h
  let abbauRatePromilleProStunde = 0.11;
  if (userData.gender === "male") abbauRatePromilleProStunde = 0.12;
  if (userData.gender === "female") abbauRatePromilleProStunde = 0.10;

  const abbauGramsProStunde = abbauRatePromilleProStunde * userData.weight * r;

  let totalAlkAufgenommen = 0;
  let totalAbbauGrams = 0;

  const abbauStartSchwelle = 0.2; // erst wenn 20 % aufgenommen

  for (let drink of drinks) {
    const trinkDauer = Math.max(1, drink.timeEnd - drink.timeStart);

    let absorption = 0;
    if (now <= drink.timeStart) {
      absorption = 0;
    } else if (now >= drink.timeEnd) {
      absorption = 1;
    } else {
      absorption = (now - drink.timeStart) / trinkDauer;
    }

    const aufgenommen = drink.grams * absorption;
    totalAlkAufgenommen += aufgenommen;

    if (absorption < abbauStartSchwelle) continue;

    const abbauStart = drink.timeStart + trinkDauer * abbauStartSchwelle;
    const abbauZeitStd = Math.max(0, (now - abbauStart) / 3600000);

    const abgebaut = Math.min(aufgenommen, abbauGramsProStunde * abbauZeitStd);
    totalAbbauGrams += abgebaut;
  }

  const nettoAlk = Math.max(0, totalAlkAufgenommen - totalAbbauGrams);
  const promille = nettoAlk / (userData.weight * r);

  return promille.toFixed(2);
}

// Promilleanzeige aktualisieren
function updatePromille() {
  const promille = calculatePromille();
  const promilleDisplay = document.getElementById("promille");
  promilleDisplay.innerText = promille;

  const value = parseFloat(promille);
  promilleDisplay.style.color =
    value >= 1.5 ? "green" :
    value <= 0.1 ? "red" :
    "orange";
}

// Labels bei Slideränderung aktualisieren
function updateDrinkLabels() {
  const amount = parseFloat(document.getElementById("amount").value);
  const alc = parseFloat(document.getElementById("alcohol").value);
  document.getElementById("amountLabel").innerText = amount.toFixed(2);
  document.getElementById("alcLabel").innerText = alc.toFixed(1);
}

// Update UI wenn Drink gewechselt wird
function updateDrinkUI() {
  const drink = drinksData[currentDrinkIndex];

  // Bild setzen
  const img = document.getElementById("drinkImage");
  img.src = drink.img;
  img.alt = drink.name;

  // Slider-Werte setzen
  document.getElementById("amount").value = drink.amount;
  document.getElementById("alcohol").value = drink.alc;

  updateDrinkLabels();
}

// Swipe-Handling für Drink-Bilder
const drinkImage = document.getElementById("drinkImage");

let startX = 0;
let currentX = 0;
let isDragging = false;

drinkImage.addEventListener("pointerdown", (e) => {
  isDragging = true;
  startX = e.clientX;
  drinkImage.style.transition = "none";
  drinkImage.setPointerCapture(e.pointerId);
});

drinkImage.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  currentX = e.clientX;
  const deltaX = currentX - startX;
  drinkImage.style.transform = translateX($,{deltaX},px);
});

drinkImage.addEventListener("pointerup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  drinkImage.style.transition = "transform 0.3s ease";

  const deltaX = e.clientX - startX;

  if (deltaX > 50) {
    // Swipe nach rechts → vorheriger Drink
    currentDrinkIndex = (currentDrinkIndex - 1 + drinksData.length) % drinksData.length;
  } else if (deltaX < -50) {
    // Swipe nach links → nächster Drink
    currentDrinkIndex = (currentDrinkIndex + 1) % drinksData.length;
  }

  updateDrinkUI();

  drinkImage.style.transform = "translateX(0)";
});

drinkImage.addEventListener("pointercancel", () => {
  isDragging = false;
  drinkImage.style.transition = "transform 0.3s ease";
  drinkImage.style.transform = "translateX(0)";
});

// App zurücksetzen
function resetApp() {
  if (confirm("Willst du wirklich alles zurücksetzen?")) {
    localStorage.removeItem("userData");
    localStorage.removeItem("drinks");
    location.reload();
  }
}

// App starten / Login speichern
function startPromilleBerechnung() {
  loginAndSaveUser();
}

// Initialisierung bei Seitenladezeit
window.onload = () => {
  const savedUser = localStorage.getItem("userData");
  if (savedUser) {
    userData = JSON.parse(savedUser);
    document.getElementById("username").value = userData.username;
    document.getElementById("weight").value = userData.weight;
    document.getElementById("gender").value = userData.gender;

    document.getElementById("setup").style.display = "none";
    document.getElementById("drinks").style.display = "block";
    document.getElementById("status").style.display = "block";
  } else {
    document.getElementById("setup").style.display = "block";
    document.getElementById("drinks").style.display = "none";
    document.getElementById("status").style.display = "none";
  }

  drinks = JSON.parse(localStorage.getItem("drinks") || "[]");

  updateDrinkLabels();
  updateDrinkUI();
  setInterval(updatePromille, 60000);
  updatePromille();

  // Ladeanimation: kurzes Wischen nach links und zurück
  setTimeout(() => {
    drinkImage.style.transition = "transform 0.2s ease";
    drinkImage.style.transform = "translateX(-30px)";
    setTimeout(() => {
      drinkImage.style.transform = "translateX(0)";
    }, 200);
  }, 400);
  document.getElementById("toggleLeaderboardBtn").addEventListener("click", () => {
  const sec = document.getElementById("leaderboardSection");
  sec.style.display = sec.style.display === "none" ? "block" : "none";
});
setInterval(autoSubmitScore, 60000); // alle 60000 ms = 1 Minute

};
window.onload = () => {
  // ... dein ganzer bestehender Code ...

  setInterval(() => {
    if (typeof window.autoSubmitScore === "function") {
      window.autoSubmitScore();
    }
  }, 60000); // alle 60 Sekunden
};

