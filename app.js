const form = document.querySelector("#planner-form");
const inputs = {
  targetCount: document.querySelector("#target-count"),
  luckRequired: document.querySelector("#luck-required"),
  ownedCount: document.querySelector("#owned-count"),
  dropsPerRun: document.querySelector("#drops-per-run"),
  minutesPerRun: document.querySelector("#minutes-per-run"),
};

const output = {
  time: document.querySelector("#time-result"),
  timeSub: document.querySelector("#time-sub"),
  runs: document.querySelector("#runs-result"),
  remaining: document.querySelector("#remaining-result"),
  progress: document.querySelector("#progress-percent"),
  progressBar: document.querySelector("#progress-bar"),
  progressFill: document.querySelector("#progress-fill"),
  progressCaption: document.querySelector("#progress-caption"),
  complete: document.querySelector("#complete-message"),
  highRuns: document.querySelector("#high-runs"),
  highTime: document.querySelector("#high-time"),
  highDrops: document.querySelector("#high-drops"),
  averageRuns: document.querySelector("#average-runs"),
  averageTime: document.querySelector("#average-time"),
  averageDrops: document.querySelector("#average-drops"),
  lowRuns: document.querySelector("#low-runs"),
  lowTime: document.querySelector("#low-time"),
  lowDrops: document.querySelector("#low-drops"),
};

const numberFormatter = new Intl.NumberFormat("ja-JP");
const storageKey = "monst-farming-planner";
const storageNote = document.querySelector("#storage-note");
const resetButton = document.querySelector("#reset-values");

function restorePlan() {
  try {
    const savedPlan = localStorage.getItem(storageKey);
    if (!savedPlan) return;

    const values = JSON.parse(savedPlan);
    for (const [key, input] of Object.entries(inputs)) {
      if (typeof values[key] === "string") input.value = values[key];
    }
  } catch {
    storageNote.textContent = "保存データを読み込めませんでした。入力し直してください。";
    storageNote.classList.add("storage-error");
  }
}

function savePlan() {
  if (!form.checkValidity()) return;

  const values = Object.fromEntries(
    Object.entries(inputs).map(([key, input]) => [key, input.value]),
  );

  try {
    localStorage.setItem(storageKey, JSON.stringify(values));
    storageNote.textContent = "入力内容はこのブラウザーに自動保存されます。";
    storageNote.classList.remove("storage-error");
  } catch {
    storageNote.textContent = "自動保存できませんでした。このブラウザーの保存設定をご確認ください。";
    storageNote.classList.add("storage-error");
  }
}

function formatDuration(totalMinutes) {
  if (totalMinutes === 0) return "約 0分";

  const roundedMinutes = Math.ceil(totalMinutes);
  const days = Math.floor(roundedMinutes / 1440);
  const hours = Math.floor((roundedMinutes % 1440) / 60);
  const minutes = roundedMinutes % 60;
  const parts = [];

  if (days > 0) parts.push(`${numberFormatter.format(days)}日`);
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分`);

  return `約 ${parts.join("")}`;
}

function calculatePlan() {
  if (!form.checkValidity()) return;

  const targetCount = Number(inputs.targetCount.value);
  const luckRequired = Number(inputs.luckRequired.value);
  const ownedCount = Number(inputs.ownedCount.value);
  const dropsPerRun = Number(inputs.dropsPerRun.value);
  const minutesPerRun = Number(inputs.minutesPerRun.value);

  if (![targetCount, luckRequired, ownedCount, dropsPerRun, minutesPerRun].every(Number.isFinite)) return;
  if (targetCount < 1 || luckRequired < 1 || ownedCount < 0 || dropsPerRun <= 0 || minutesPerRun <= 0) return;

  const totalRequired = targetCount * luckRequired;
  const remaining = Math.max(0, totalRequired - ownedCount);
  const runs = Math.ceil(remaining / dropsPerRun);
  const totalMinutes = runs * minutesPerRun;
  const progress = Math.min(100, (ownedCount / totalRequired) * 100);
  const formattedRuns = numberFormatter.format(runs);
  const formattedDrops = numberFormatter.format(remaining);
  const formattedOwned = numberFormatter.format(Math.min(ownedCount, totalRequired));
  const formattedTotal = numberFormatter.format(totalRequired);

  const scenarios = [
    { multiplier: 1.2, runs: output.highRuns, time: output.highTime, drops: output.highDrops },
    { multiplier: 1, runs: output.averageRuns, time: output.averageTime, drops: output.averageDrops },
    { multiplier: 0.8, runs: output.lowRuns, time: output.lowTime, drops: output.lowDrops },
  ];

  for (const scenario of scenarios) {
    const scenarioDrops = dropsPerRun * scenario.multiplier;
    const scenarioRuns = Math.ceil(remaining / scenarioDrops);
    scenario.runs.textContent = numberFormatter.format(scenarioRuns);
    scenario.time.textContent = formatDuration(scenarioRuns * minutesPerRun);
    scenario.drops.textContent = numberFormatter.format(scenarioDrops);
  }

  output.time.textContent = formatDuration(totalMinutes);
  output.timeSub.textContent = `1周${minutesPerRun}分 × ${formattedRuns}周`;
  output.runs.textContent = formattedRuns;
  output.remaining.textContent = formattedDrops;
  output.progress.textContent = `${Math.floor(progress)}%`;
  output.progressBar.setAttribute("aria-valuenow", String(Math.floor(progress)));
  output.progressFill.style.width = `${progress}%`;
  output.progressCaption.textContent = `${formattedOwned} / ${formattedTotal}体`;
  output.complete.hidden = remaining > 0;
}

form.addEventListener("input", () => {
  calculatePlan();
  savePlan();
});
form.addEventListener("change", () => {
  calculatePlan();
  savePlan();
});
resetButton.addEventListener("click", () => {
  for (const input of Object.values(inputs)) {
    input.value = input.defaultValue;
  }

  calculatePlan();
  savePlan();
});

restorePlan();
calculatePlan();
