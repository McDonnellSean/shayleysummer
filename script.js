const YEAR = 2026;
const MONTH = 6; // July (0-indexed)

// steps: array of stop names, chained with an arrow in the UI
// type: "weekday" | "weekend" | "special"
const events = {
  2:  { type: "weekday", steps: ["Mustard's Bagels", "The Little Marionette"] },
  3:  { type: "weekday", steps: ["Lius Cafe"] },
  4:  { type: "weekend", steps: ["Beach", "Jessica & Greg"] },
  5:  { type: "weekend", steps: ["Dodger Game"] },
  6:  { type: "weekday", steps: ["Nabiya", "Mewame"] },
  7:  { type: "weekday", steps: ["Sunset", "Leid Cookies"] },
  8:  { type: "weekday", steps: ["Mustard's Bagels", "The Little Marionette"] },
  9:  { type: "weekday", steps: ["Lius Cafe"] },
  10: { type: "weekday", steps: ["Nabiya", "Mewame"] },
  11: { type: "weekend", steps: ["Salted Butter Co. pastries", "Huntington Gardens", "Mandarin Coffee"] },
  12: { type: "special", steps: ["2 Year Anniversary — Santa Barbara"] },
  13: { type: "special", steps: ["2 Year Anniversary — Santa Barbara"] },
  14: { type: "weekday", steps: ["Sunset", "Leid Cookies"] },
  15: { type: "weekday", steps: ["Mustard's Bagels", "The Little Marionette"] },
  16: { type: "weekday", steps: ["Lius Cafe"] },
  17: { type: "weekday", steps: ["Nabiya", "Mewame"] },
  18: { type: "weekend", steps: ["Los Leones Canyon", "Main Squeeze + Santa Monica walk", "Heavy Handed"] },
  19: { type: "weekend", steps: ["LACMA", "Antico Nuovo", "Matsu Matcha"] },
  20: { type: "weekday", steps: ["Sunset", "Leid Cookies"] },
  21: { type: "weekday", steps: ["Mustard's Bagels", "The Little Marionette"] },
  22: { type: "weekday", steps: ["Lius Cafe"] },
  23: { type: "weekday", steps: ["Nabiya", "Mewame"] },
  24: { type: "weekday", steps: ["Sunset", "Leid Cookies"] },
  25: { type: "special", steps: ["She leaves 💔"] },
};

const calendarEl = document.getElementById("calendar");
const overlay = document.getElementById("overlay");
const modalDate = document.getElementById("modalDate");
const modalTitle = document.getElementById("modalTitle");
const modalSteps = document.getElementById("modalSteps");
const modalClose = document.getElementById("modalClose");

const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
const today = new Date();
const isCurrentMonth = today.getFullYear() === YEAR && today.getMonth() === MONTH;

for (let i = 0; i < firstWeekday; i++) {
  const empty = document.createElement("div");
  empty.className = "day empty";
  calendarEl.appendChild(empty);
}

for (let d = 1; d <= daysInMonth; d++) {
  const dayEl = document.createElement("div");
  const info = events[d];
  dayEl.className = "day" + (info ? " has-event" : "") + (isCurrentMonth && today.getDate() === d ? " today" : "");

  const num = document.createElement("div");
  num.className = "day-num";
  num.textContent = d;
  dayEl.appendChild(num);

  if (info) {
    const chip = document.createElement("div");
    chip.className = "event-chip " + info.type;
    chip.textContent = info.steps.join(" → ");
    dayEl.appendChild(chip);
    dayEl.addEventListener("click", () => openModal(d, info));
  }

  calendarEl.appendChild(dayEl);
}

function openModal(day, info) {
  const dateObj = new Date(YEAR, MONTH, day);
  modalDate.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  modalTitle.textContent = info.steps[0];
  modalSteps.innerHTML = "";
  info.steps.forEach((step, idx) => {
    const row = document.createElement("div");
    row.className = "modal-step";
    if (idx > 0) {
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "→";
      row.appendChild(arrow);
    }
    const label = document.createElement("span");
    label.textContent = step;
    row.appendChild(label);
    modalSteps.appendChild(row);
  });
  overlay.classList.add("open");
}

modalClose.addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") overlay.classList.remove("open");
});
