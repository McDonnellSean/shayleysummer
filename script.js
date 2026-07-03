import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPfcJwZh3i32h1I1RBtbkuHxEhJq4GZP8",
  authDomain: "shayleysummer.firebaseapp.com",
  projectId: "shayleysummer",
  storageBucket: "shayleysummer.firebasestorage.app",
  messagingSenderId: "817841616398",
  appId: "1:817841616398:web:7998cf720bdafdcbb9ae5f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const activitiesRef = collection(db, "activities");

const YEAR = 2026;
const MONTH = 6; // July (0-indexed)

// Used once to populate Firestore the first time the site ever loads.
// type: "weekday" | "weekend" | "special"
const seedActivities = [
  { day: 3,  type: "special", steps: ["The Getty", "Argentina game", "Dinner"] },
  { day: 4,  type: "weekend", steps: ["Beach", "Jessica & Greg"] },
  { day: 5,  type: "weekend", steps: ["Dodger Game"] },
  { day: 8,  type: "weekday", steps: ["Mustard's Bagels", "The Little Marionette"] },
  { day: 11, type: "weekend", steps: ["Salted Butter Co. pastries", "Huntington Gardens", "Mandarin Coffee"] },
  { day: 12, type: "special", steps: ["2 Year Anniversary — Santa Barbara"] },
  { day: 13, type: "special", steps: ["2 Year Anniversary — Santa Barbara"] },
  { day: 15, type: "weekday", steps: ["Nabiya", "Mewame"] },
  { day: 18, type: "weekend", steps: ["Los Leones Canyon", "Main Squeeze + Santa Monica walk", "Heavy Handed"] },
  { day: 19, type: "weekend", steps: ["LACMA", "Antico Nuovo", "Matsu Matcha"] },
  { day: 21, type: "weekday", steps: ["Lius Cafe"] },
  { day: 24, type: "weekday", steps: ["Sunset", "Leid Cookies"] },
  { day: 25, type: "special", steps: ["She leaves 💔"] },
];

async function seedIfEmpty() {
  const snap = await getDocs(activitiesRef);
  if (!snap.empty) return;
  const batch = writeBatch(db);
  seedActivities.forEach((activity) => {
    batch.set(doc(activitiesRef), activity);
  });
  await batch.commit();
}

const calendarEl = document.getElementById("calendar");
const overlay = document.getElementById("overlay");
const modalDate = document.getElementById("modalDate");
const modalActivities = document.getElementById("modalActivities");
const modalClose = document.getElementById("modalClose");
const addForm = document.getElementById("addForm");
const addInput = document.getElementById("addInput");
const addType = document.getElementById("addType");

const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();

let activitiesByDay = {};
let selectedDay = null;

function buildCalendar() {
  calendarEl.innerHTML = "";
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === YEAR && today.getMonth() === MONTH;

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement("div");
    dayEl.className = "day clickable" + (isCurrentMonth && today.getDate() === d ? " today" : "");

    const num = document.createElement("div");
    num.className = "day-num";
    num.textContent = d;
    dayEl.appendChild(num);

    (activitiesByDay[d] || []).forEach((activity) => {
      const chip = document.createElement("div");
      chip.className = "event-chip " + activity.type;
      chip.textContent = activity.steps.join(" → ");
      dayEl.appendChild(chip);
    });

    dayEl.addEventListener("click", () => openModal(d));
    calendarEl.appendChild(dayEl);
  }
}

function renderModalActivities(day) {
  const dateObj = new Date(YEAR, MONTH, day);
  modalDate.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  modalActivities.innerHTML = "";
  const dayActivities = activitiesByDay[day] || [];

  if (dayActivities.length === 0) {
    const empty = document.createElement("p");
    empty.className = "modal-empty";
    empty.textContent = "Nothing planned yet.";
    modalActivities.appendChild(empty);
  }

  dayActivities.forEach((activity) => {
    const row = document.createElement("div");
    row.className = "modal-activity";

    const text = document.createElement("span");
    text.className = "modal-activity-text " + activity.type;
    text.textContent = activity.steps.join(" → ");
    row.appendChild(text);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "modal-delete";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteDoc(doc(db, "activities", activity.id)));
    row.appendChild(del);

    modalActivities.appendChild(row);
  });
}

function openModal(day) {
  selectedDay = day;
  addInput.value = "";
  const dow = new Date(YEAR, MONTH, day).getDay();
  addType.value = (dow === 0 || dow === 6) ? "weekend" : "weekday";
  renderModalActivities(day);
  overlay.classList.add("open");
}

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedDay || !addInput.value.trim()) return;
  const steps = addInput.value.split("→").join(">").split("->").join(">")
    .split(">").map((s) => s.trim()).filter(Boolean);
  await addDoc(activitiesRef, { day: selectedDay, type: addType.value, steps });
  addInput.value = "";
});

modalClose.addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") overlay.classList.remove("open");
});

onSnapshot(activitiesRef, (snap) => {
  activitiesByDay = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const activity = { id: docSnap.id, type: data.type, steps: data.steps };
    (activitiesByDay[data.day] ||= []).push(activity);
  });
  buildCalendar();
  if (overlay.classList.contains("open") && selectedDay) {
    renderModalActivities(selectedDay);
  }
});

seedIfEmpty();
