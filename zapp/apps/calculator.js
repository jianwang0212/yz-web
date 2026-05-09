const expressionEl = document.querySelector("#expression");
const resultEl = document.querySelector("#result");
const keys = document.querySelector(".keys");

let expression = "";
let justEvaluated = false;

const operators = new Set(["+", "-", "*", "/", "%"]);

function displayExpression() {
  return expression.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("-", "−") || "0";
}

function sanitize(value) {
  return value.replace(/[^0-9+\-*/%.() ]/g, "");
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
  }).format(value);
}

function compute(value) {
  const clean = sanitize(value);
  if (!clean || clean !== value) return "Error";
  try {
    const answer = Function(`"use strict"; return (${clean})`)();
    return formatNumber(Number(answer));
  } catch {
    return "Error";
  }
}

function update(preview = true) {
  expressionEl.textContent = displayExpression();
  if (!expression) {
    resultEl.textContent = "0";
    return;
  }

  if (!preview || operators.has(expression.at(-1))) return;
  resultEl.textContent = compute(expression);
}

function append(value) {
  const last = expression.at(-1);

  if (justEvaluated && !operators.has(value)) {
    expression = "";
  }
  justEvaluated = false;

  if (operators.has(value) && operators.has(last)) {
    expression = expression.slice(0, -1) + value;
  } else {
    expression += value;
  }

  update();
}

function clear() {
  expression = "";
  justEvaluated = false;
  update();
}

function removeLast() {
  expression = expression.slice(0, -1);
  justEvaluated = false;
  update();
}

function equals() {
  const answer = compute(expression);
  resultEl.textContent = answer;
  expressionEl.textContent = displayExpression();
  if (answer !== "Error") {
    expression = answer.replaceAll(",", "");
    justEvaluated = true;
  }
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, value } = button.dataset;
  if (action === "clear") clear();
  if (action === "delete") removeLast();
  if (action === "equals") equals();
  if (value) append(value);
});

window.addEventListener("keydown", (event) => {
  const keyMap = {
    Enter: "equals",
    Escape: "clear",
    Backspace: "delete",
  };

  if (/^[0-9+\-*/%.()]$/.test(event.key)) {
    event.preventDefault();
    append(event.key);
  }

  if (keyMap[event.key] === "equals") {
    event.preventDefault();
    equals();
  }

  if (keyMap[event.key] === "clear") {
    event.preventDefault();
    clear();
  }

  if (keyMap[event.key] === "delete") {
    event.preventDefault();
    removeLast();
  }
});

update();
