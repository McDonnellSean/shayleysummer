import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
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
const queueList = document.getElementById("queueList");
const queueAddForm = document.getElementById("queueAddForm");
const queueAddInput = document.getElementById("queueAddInput");
const queueAddType = document.getElementById("queueAddType");

const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();

let activitiesByDay = {};
let queueItems = [];
let selectedDay = null;

function splitSteps(text) {
  return text.split("→").join(">").split("->").join(">")
    .split(">").map((s) => s.trim()).filter(Boolean);
}

function rescheduleActivity(id, day) {
  if (!id) return;
  updateDoc(doc(db, "activities", id), { day });
}

function buildCalendar() {
  calendarEl.innerHTML = "";
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendarEl.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(YEAR, MONTH, d);
    const isPast = dateObj < todayMidnight;
    const isToday = dateObj.getTime() === todayMidnight.getTime();

    const dayEl = document.createElement("div");
    dayEl.className = "day clickable" + (isToday ? " today" : "") + (isPast ? " past" : "");

    const num = document.createElement("div");
    num.className = "day-num";
    num.textContent = d;
    dayEl.appendChild(num);

    (activitiesByDay[d] || []).forEach((activity) => {
      const chip = document.createElement("div");
      chip.className = "event-chip " + activity.type;
      chip.textContent = activity.steps.join(" → ");
      chip.draggable = true;
      chip.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/plain", activity.id);
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
      dayEl.appendChild(chip);
    });

    dayEl.addEventListener("click", () => openModal(d));
    dayEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      dayEl.classList.add("drag-over");
    });
    dayEl.addEventListener("dragleave", () => dayEl.classList.remove("drag-over"));
    dayEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dayEl.classList.remove("drag-over");
      rescheduleActivity(e.dataTransfer.getData("text/plain"), d);
    });
    calendarEl.appendChild(dayEl);
  }
}

function renderQueue() {
  queueList.innerHTML = "";

  if (queueItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "queue-empty";
    empty.textContent = "No ideas queued yet.";
    queueList.appendChild(empty);
    return;
  }

  queueItems.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "queue-item " + activity.type;
    item.draggable = true;

    const text = document.createElement("span");
    text.textContent = activity.steps.join(" → ");
    item.appendChild(text);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "queue-delete";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteDoc(doc(db, "activities", activity.id));
    });
    item.appendChild(del);

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", activity.id);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));

    queueList.appendChild(item);
  });
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
  const steps = splitSteps(addInput.value);
  await addDoc(activitiesRef, { day: selectedDay, type: addType.value, steps });
  addInput.value = "";
});

queueAddForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!queueAddInput.value.trim()) return;
  const steps = splitSteps(queueAddInput.value);
  await addDoc(activitiesRef, { day: null, type: queueAddType.value, steps });
  queueAddInput.value = "";
});

queueList.addEventListener("dragover", (e) => {
  e.preventDefault();
  queueList.classList.add("drag-over");
});
queueList.addEventListener("dragleave", () => queueList.classList.remove("drag-over"));
queueList.addEventListener("drop", (e) => {
  e.preventDefault();
  queueList.classList.remove("drag-over");
  rescheduleActivity(e.dataTransfer.getData("text/plain"), null);
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
  queueItems = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const activity = { id: docSnap.id, type: data.type, steps: data.steps };
    if (data.day == null) {
      queueItems.push(activity);
    } else {
      (activitiesByDay[data.day] ||= []).push(activity);
    }
  });
  buildCalendar();
  renderQueue();
  if (overlay.classList.contains("open") && selectedDay) {
    renderModalActivities(selectedDay);
  }
});

seedIfEmpty();
