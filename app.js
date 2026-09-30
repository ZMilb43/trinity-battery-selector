const SPEC = {
  kWhPerUnit: 13.5,
  kWPerPw3: 11.5,
  kWOffgridPerPw3: 15.4,
  kWChargeAlone: 5,
  kWChargeWithExp: 8,
  maxPw3: 4,
  maxExp: 3,
  maxTotal: 7,
  hoursPerYear: 8760,
  daysPerYear: 365,
};

const SAMPLE_LOADS = [
  { name: "Refrigerator", watts: 150 },
  { name: "Essentials (fridge, lights, well, Wi-Fi)", watts: 800 },
  { name: "This home’s average", watts: null },
  { name: "Central air while running", watts: 3500 },
  { name: "Level 2 EV charging", watts: 7200 },
];

const state = {
  pw3: 1,
  exp: 0,
  annualKwh: 10000,
  loadPercent: 100,
  name: "",
};

const els = {
  name: document.getElementById("customer-name"),
  annual: document.getElementById("annual-kwh"),
  usageHint: document.getElementById("usage-hint"),
  chips: document.querySelectorAll(".chip"),
  pw3Count: document.getElementById("pw3-count"),
  expCount: document.getElementById("exp-count"),
  limitNote: document.getElementById("limit-note"),
  loadHint: document.getElementById("load-hint"),
  rack: document.getElementById("rack"),
  rackCaption: document.getElementById("rack-caption"),
  kicker: document.getElementById("results-kicker"),
  runtimeHours: document.getElementById("runtime-hours"),
  runtimeSub: document.getElementById("runtime-sub"),
  dayFill: document.getElementById("day-fill"),
  energy: document.getElementById("energy-kwh"),
  energyNote: document.getElementById("energy-note"),
  power: document.getElementById("power-kw"),
  powerNote: document.getElementById("power-note"),
  coach: document.getElementById("coach"),
  daily: document.getElementById("fact-daily"),
  load: document.getElementById("fact-load"),
  days: document.getElementById("fact-days"),
  charge: document.getElementById("fact-charge"),
  formula: document.getElementById("formula"),
  loadList: document.getElementById("load-list"),
  shareStatus: document.getElementById("share-status"),
};

function clampConfig(pw3, exp) {
  let nextPw3 = Math.min(SPEC.maxPw3, Math.max(1, pw3));
  let nextExp = Math.min(SPEC.maxExp, Math.max(0, exp));
  if (nextPw3 + nextExp > SPEC.maxTotal) {
    nextExp = SPEC.maxTotal - nextPw3;
  }
  return { pw3: nextPw3, exp: nextExp };
}

function chargeKw(pw3, exp) {
  if (exp > 0) return SPEC.kWChargeWithExp + (pw3 - 1) * SPEC.kWChargeAlone;
  return pw3 * SPEC.kWChargeAlone;
}

function sizeSystem(input) {
  const { pw3, exp } = clampConfig(input.pw3, input.exp);
  const annualKwh = Math.max(0, Number(input.annualKwh) || 0);
  const loadPercent = Number(input.loadPercent) || 100;
  const energyKwh = (pw3 + exp) * SPEC.kWhPerUnit;
  const powerKw = pw3 * SPEC.kWPerPw3;
  const offgridKw = pw3 * SPEC.kWOffgridPerPw3;
  const dailyKwh = annualKwh / SPEC.daysPerYear;
  const avgKw = annualKwh / SPEC.hoursPerYear;
  const loadKw = avgKw * (loadPercent / 100);
  const runtimeHours = loadKw > 0 ? energyKwh / loadKw : 0;
  const runtimeDays = loadKw > 0 ? energyKwh / (dailyKwh * (loadPercent / 100)) : 0;
  return {
    pw3,
    exp,
    annualKwh,
    loadPercent,
    energyKwh,
    powerKw,
    offgridKw,
    dailyKwh,
    avgKw,
    loadKw,
    runtimeHours,
    runtimeDays,
    chargeKw: chargeKw(pw3, exp),
  };
}

function formatNumber(value, digits) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatHours(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  if (hours < 48) return formatNumber(hours, 1);
  return formatNumber(hours, 0);
}

function unitLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function coachCopy(sized) {
  if (sized.exp === 0 && sized.pw3 === 1) {
    return "A Powerwall 3 adds both energy and power. Add an expansion for more hours, or a second Powerwall 3 if this home needs more inverter power for large loads.";
  }
  if (sized.exp > 0 && sized.pw3 === 1) {
    return `Expansions add ${formatNumber(sized.exp * SPEC.kWhPerUnit, 1)} kWh of storage and leave power at 11.5 kW. Choose another Powerwall 3 if central AC, a well pump, or EV charging need to run together during an outage.`;
  }
  return `${unitLabel(sized.pw3, "Powerwall 3", "Powerwall 3 units")} supply ${formatNumber(sized.powerKw, 1)} kW. ${
    sized.exp
      ? unitLabel(sized.exp, "expansion", "expansions") + " stretch runtime without adding inverter power."
      : "Expansions would add hours only — useful when " + formatNumber(sized.powerKw, 1) + " kW already covers the house."
  }`;
}

function renderRack(sized) {
  const nodes = [];
  for (let i = 0; i < sized.pw3; i += 1) {
    nodes.push(`<div class="unit pw3"><span>PW3</span></div>`);
  }
  for (let i = 0; i < sized.exp; i += 1) {
    nodes.push(`<div class="unit exp"><span>EXP</span></div>`);
  }
  els.rack.innerHTML = nodes.join("");
  const parts = [unitLabel(sized.pw3, "Powerwall 3", "Powerwall 3 units")];
  if (sized.exp) parts.push(unitLabel(sized.exp, "expansion", "expansions"));
  els.rackCaption.textContent = parts.join(" + ");
}

function renderLoads(sized) {
  els.loadList.innerHTML = SAMPLE_LOADS.map((item) => {
    const watts = item.watts == null ? sized.loadKw * 1000 : item.watts;
    const hours = watts > 0 ? sized.energyKwh / (watts / 1000) : 0;
    return `<li><span>${item.name}</span><span class="watts">${formatNumber(watts, 0)} W</span><span class="hours">${formatHours(hours)} h</span></li>`;
  }).join("");
}

function updateSteppers(sized) {
  els.pw3Count.textContent = String(sized.pw3);
  els.expCount.textContent = String(sized.exp);
  document.querySelectorAll('[data-stepper="pw3"] .stepper-btn').forEach((btn) => {
    const delta = Number(btn.dataset.delta);
    btn.disabled = delta < 0 ? sized.pw3 <= 1 : sized.pw3 >= SPEC.maxPw3 || sized.pw3 + sized.exp >= SPEC.maxTotal;
  });
  document.querySelectorAll('[data-stepper="exp"] .stepper-btn').forEach((btn) => {
    const delta = Number(btn.dataset.delta);
    btn.disabled = delta < 0 ? sized.exp <= 0 : sized.exp >= SPEC.maxExp || sized.pw3 + sized.exp >= SPEC.maxTotal;
  });
}

function limitMessage(nextPw3, nextExp, attempted) {
  if (attempted === "pw3" && nextPw3 >= SPEC.maxPw3) {
    return "Tesla supports up to 4 Powerwall 3 units on one system.";
  }
  if (attempted === "exp" && nextExp >= SPEC.maxExp) {
    return "Tesla supports up to 3 expansion modules, connected to the leader Powerwall 3.";
  }
  if (nextPw3 + nextExp >= SPEC.maxTotal) {
    return "Maximum system size is 7 units: 4 Powerwall 3 + 3 expansions.";
  }
  return "";
}

function render() {
  const sized = sizeSystem(state);
  state.pw3 = sized.pw3;
  state.exp = sized.exp;

  const loadName = sized.loadPercent === 100 ? "whole-home" : "essentials";
  els.kicker.textContent = state.name.trim() ? `${state.name.trim()} · system snapshot` : "System snapshot";
  els.usageHint.textContent = `About ${formatNumber(sized.dailyKwh, 1)} kWh per day, ${formatNumber(sized.avgKw, 2)} kW average.`;
  els.loadHint.textContent =
    sized.loadPercent === 100
      ? "Uses this home’s average load from annual usage."
      : "Essentials uses 40% of this home’s average load — fridge, lights, well, internet.";

  els.runtimeHours.textContent = formatHours(sized.runtimeHours);
  els.runtimeSub.textContent = `of ${loadName} backup if the battery is full at the start of an outage · ${formatNumber(sized.runtimeDays, 1)} days`;
  els.dayFill.style.width = `${Math.min(100, (sized.runtimeHours / 24) * 100)}%`;

  els.energy.textContent = formatNumber(sized.energyKwh, 1);
  els.energyNote.textContent = `${sized.pw3 + sized.exp} × 13.5 kWh`;
  els.power.textContent = formatNumber(sized.powerKw, 1);
  els.powerNote.textContent = `Continuous on-grid. Off-grid ${formatNumber(sized.offgridKw, 1)} kW.`;
  els.coach.textContent = coachCopy(sized);
  els.daily.textContent = `${formatNumber(sized.dailyKwh, 1)} kWh`;
  els.load.textContent = `${formatNumber(sized.loadKw, 2)} kW`;
  els.days.textContent = `${formatNumber(sized.runtimeDays, 1)} days`;
  els.charge.textContent = `${formatNumber(sized.chargeKw, 1)} kW`;
  els.formula.textContent = `${formatNumber(sized.energyKwh, 1)} kWh / ${formatNumber(sized.loadKw, 2)} kW = ${formatHours(sized.runtimeHours)} hours`;

  els.chips.forEach((chip) => {
    chip.classList.toggle("is-on", Number(chip.dataset.kwh) === sized.annualKwh);
  });

  updateSteppers(sized);
  renderRack(sized);
  renderLoads(sized);
  writeUrl(sized);
}

function writeUrl(sized) {
  const params = new URLSearchParams();
  params.set("pw3", String(sized.pw3));
  params.set("exp", String(sized.exp));
  params.set("kwh", String(Math.round(sized.annualKwh)));
  params.set("load", String(sized.loadPercent));
  if (state.name.trim()) params.set("name", state.name.trim());
  const next = `${location.pathname}?${params.toString()}`;
  history.replaceState(null, "", next);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  if (params.has("pw3") || params.has("exp") || params.has("kwh") || params.has("load") || params.has("name")) {
    const clamped = clampConfig(Number(params.get("pw3") || 1), Number(params.get("exp") || 0));
    state.pw3 = clamped.pw3;
    state.exp = clamped.exp;
    state.annualKwh = Number(params.get("kwh") || 10000);
    state.loadPercent = Number(params.get("load") || 100) === 40 ? 40 : 100;
    state.name = params.get("name") || "";
    els.name.value = state.name;
    els.annual.value = String(state.annualKwh);
    document.querySelectorAll(".seg").forEach((btn) => {
      const on = Number(btn.dataset.load) === state.loadPercent;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
}

function shift(kind, delta) {
  const attempted = kind;
  if (kind === "pw3") state.pw3 += delta;
  else state.exp += delta;
  const clamped = clampConfig(state.pw3, state.exp);
  const message = delta > 0 ? limitMessage(clamped.pw3, clamped.exp, attempted) : "";
  state.pw3 = clamped.pw3;
  state.exp = clamped.exp;
  els.limitNote.hidden = !message;
  els.limitNote.textContent = message;
  render();
}

document.querySelectorAll(".stepper").forEach((group) => {
  group.addEventListener("click", (event) => {
    const btn = event.target.closest(".stepper-btn");
    if (!btn || btn.disabled) return;
    shift(group.dataset.stepper, Number(btn.dataset.delta));
  });
});

els.chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    state.annualKwh = Number(chip.dataset.kwh);
    els.annual.value = String(state.annualKwh);
    render();
  });
});

els.annual.addEventListener("input", () => {
  state.annualKwh = Number(els.annual.value);
  render();
});

els.name.addEventListener("input", () => {
  state.name = els.name.value;
  render();
});

document.querySelectorAll(".seg").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.loadPercent = Number(btn.dataset.load);
    document.querySelectorAll(".seg").forEach((other) => {
      const on = other === btn;
      other.classList.toggle("is-on", on);
      other.setAttribute("aria-checked", on ? "true" : "false");
    });
    render();
  });
});

document.getElementById("copy-link").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    els.shareStatus.textContent = "Link copied.";
  } catch {
    els.shareStatus.textContent = "Copy the address bar to share this snapshot.";
  }
});

document.getElementById("print-btn").addEventListener("click", () => window.print());

window.TrinityBattery = { SPEC, sizeSystem, clampConfig };

readUrl();
render();
