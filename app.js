const form = document.querySelector("#planner-form");
const inputs = {
  targetCount: document.querySelector("#target-count"),
  luckRequired: document.querySelector("#luck-required"),
  ownedCount: document.querySelector("#owned-count"),
  dropsPerRun: document.querySelector("#drops-per-run"),
  minutesPerRun: document.querySelector("#minutes-per-run"),
};

const tabs = [...document.querySelectorAll(".planner-tab")];
const planner = document.querySelector("#planner");
const modeContent = {
  quest: {
    title: "運極まで、あと何周？",
    intro: "目標と周回ペースを入力すると、必要な周回数と時間の目安がわかります。",
    plannerLabel: "運極周回の計算",
    estimateLabel: "周回の目安",
    targetLabel: "運極を作る数",
    targetHelp: "完成させたいキャラの数",
    targetUnit: "体",
    requiredLabel: "1体に必要なラック",
    requiredHelp: "通常の運極なら99",
    requiredUnit: "",
    ownedLabel: "今持っている数",
    ownedHelp: "対象キャラのラック合計",
    unit: "体",
    runUnit: "周",
    runLabel: "必要な周回数",
    timeLabel: "クエスト1周の時間",
    timeSubUnit: "周",
    scenarioSuffix: " / 周",
    dropsLabel: "1周の平均ドロップ",
    dropsHelp: "宝箱など込みの平均",
    dropsInputUnit: "体",
    note: "ドロップ数は平均値で計算します。実際の周回数・時間は目安です。",
    resultTitle: "運極完成まで",
    remainingLabel: "あと必要なドロップ",
    progressLabel: "運極までの進捗",
    scenarioLabel: "ドロップの上振れ・下振れ",
    scenarioDescription: "平均ドロップを基準に計算",
    complete: "目標達成！周回は必要ありません 🎉",
    defaults: { targetCount: "1", luckRequired: "99", ownedCount: "0", dropsPerRun: "3", minutesPerRun: "5" },
  },
  fragments: {
    title: "守護獣のカケラ集め",
    intro: "最終目標のカケラ数と1周あたりの平均ドロップ数から、必要なクエスト数と時間の目安を計算します。",
    plannerLabel: "守護獣のカケラ集めの計算",
    estimateLabel: "必要なクエスト数の目安",
    targetLabel: "カケラを集めるのに必要なクエストの数",
    targetHelp: "カケラ集めのために周回するクエスト数",
    targetUnit: "つ",
    requiredLabel: "1クエストで集めるカケラの数",
    requiredHelp: "1クエストで集める数（最大200個）",
    requiredUnit: "個",
    ownedLabel: "最終的に集めたいカケラの数",
    ownedHelp: "目標にするカケラの合計数",
    unit: "個",
    runUnit: "つ",
    runLabel: "必要なクエスト数",
    timeLabel: "クエスト1回の時間",
    timeSubUnit: "周",
    scenarioSuffix: " / 周",
    dropsLabel: "1周の平均ドロップ数",
    dropsHelp: "クエスト報酬など込みの平均",
    dropsInputUnit: "個 / 周",
    note: "平均ドロップ数とクエスト1回の時間から、必要周回数と所要時間を計算します。",
    resultTitle: "カケラ集め完了まで",
    remainingLabel: "目標のカケラ数",
    progressLabel: "目標カケラ数",
    scenarioLabel: "カケラ獲得数の上振れ・下振れ",
    scenarioDescription: "平均ドロップ数を基準に計算",
    complete: "目標達成！カケラ集めは完了です 🎉",
    defaults: { targetCount: "1", luckRequired: "200", ownedCount: "2000", dropsPerRun: "50", minutesPerRun: "5" },
  },
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
  remainingLabel: document.querySelector("#remaining-label"),
  remainingUnit: document.querySelector("#remaining-unit"),
  progressLabel: document.querySelector("#progress-label"),
  targetCountUnit: document.querySelector("#target-count-unit"),
  luckRequiredUnit: document.querySelector("#luck-required-unit"),
  minutesPerRunLabel: document.querySelector("#minutes-per-run-label"),
  runsLabel: document.querySelector(".stats .stat:first-child .stat-label"),
  runsUnit: document.querySelector("#runs-unit"),
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
const modeStorageKey = `${storageKey}-mode`;
const storageNote = document.querySelector("#storage-note");
const resetButton = document.querySelector("#reset-values");
let activeMode = "quest";

function applyMode(mode) {
  const content = modeContent[mode];
  activeMode = mode;

  document.querySelector("#page-title").textContent = content.title;
  document.querySelector(".intro-copy").textContent = content.intro;
  planner.setAttribute("aria-label", content.plannerLabel);
  document.querySelector("#estimate-label").textContent = content.estimateLabel;
  document.querySelector("#target-count-label").textContent = content.targetLabel;
  document.querySelector("#target-count-help").textContent = content.targetHelp;
  output.targetCountUnit.textContent = content.targetUnit;
  document.querySelector("#luck-required-label").textContent = content.requiredLabel;
  document.querySelector("#luck-required-help").textContent = content.requiredHelp;
  output.luckRequiredUnit.textContent = content.requiredUnit;
  output.luckRequiredUnit.hidden = !content.requiredUnit;
  inputs.luckRequired.max = mode === "fragments" ? "200" : "9999";
  inputs.targetCount.disabled = mode === "fragments";
  inputs.luckRequired.disabled = mode === "fragments";
  inputs.ownedCount.min = mode === "fragments" ? "1" : "0";
  document.querySelector("#target-count-field").hidden = mode === "fragments";
  document.querySelector("#luck-required-field").hidden = mode === "fragments";
  inputs.dropsPerRun.disabled = false;
  document.querySelector("#drops-per-run-field").hidden = false;
  planner.dataset.mode = mode;
  document.querySelector("#owned-count-label").textContent = content.ownedLabel;
  document.querySelector("#owned-count-help").textContent = content.ownedHelp;
  document.querySelector("#owned-count-unit").textContent = content.unit;
  document.querySelector("#drops-per-run-label").textContent = content.dropsLabel;
  document.querySelector("#drops-per-run-help").textContent = content.dropsHelp;
  document.querySelector("#drops-per-run-unit").textContent = content.dropsInputUnit;
  document.querySelector("#form-note-text").textContent = content.note;
  output.remainingLabel.textContent = content.remainingLabel;
  output.remainingUnit.textContent = content.unit;
  output.progressLabel.textContent = content.progressLabel;
  output.runsLabel.textContent = content.runLabel;
  output.runsUnit.textContent = content.runUnit;
  output.minutesPerRunLabel.textContent = content.timeLabel;
  document.querySelectorAll(".scenario-runs-unit").forEach((unit) => {
    unit.textContent = content.runUnit;
  });
  document.querySelectorAll(".scenario-drop-suffix").forEach((suffix) => {
    suffix.textContent = content.scenarioSuffix;
  });
  output.progressBar.setAttribute("aria-label", content.progressLabel);
  document.querySelector("#scenario-heading-label").textContent = content.scenarioLabel;
  document.querySelector("#scenario-description").textContent = content.scenarioDescription;
  document.querySelector("#scenario-block").setAttribute("aria-label", content.scenarioLabel);
  output.complete.textContent = content.complete;
  document.querySelectorAll(".scenario-drop-unit").forEach((unit) => {
    unit.textContent = content.unit;
  });
  document.querySelector("#result-title").textContent = content.resultTitle;

  for (const tab of tabs) {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }

  planner.setAttribute("aria-labelledby", tabs.find((tab) => tab.dataset.mode === mode).id);
  calculatePlan();
}

function restorePlan(mode) {
  try {
    const savedPlan = localStorage.getItem(mode === "quest" ? storageKey : `${storageKey}-${mode}`);
    const values = savedPlan ? JSON.parse(savedPlan) : modeContent[mode].defaults;

    for (const [key, input] of Object.entries(inputs)) {
      if (typeof values[key] === "string") input.value = values[key];
    }
    if (mode === "fragments" && Number(inputs.ownedCount.value) < 1) {
      inputs.ownedCount.value = modeContent.fragments.defaults.ownedCount;
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
    const key = activeMode === "quest" ? storageKey : `${storageKey}-${activeMode}`;
    localStorage.setItem(key, JSON.stringify(values));
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
  if (targetCount < 1 || luckRequired < 1 || ownedCount < (activeMode === "fragments" ? 1 : 0) || dropsPerRun <= 0 || minutesPerRun <= 0) return;

  const totalRequired = activeMode === "fragments" ? ownedCount : targetCount * luckRequired;
  const remaining = activeMode === "fragments" ? totalRequired : Math.max(0, totalRequired - ownedCount);
  const runs = Math.ceil(remaining / dropsPerRun);
  const totalMinutes = runs * minutesPerRun;
  const progress = activeMode === "fragments" ? 0 : Math.min(100, (ownedCount / totalRequired) * 100);
  const formattedRuns = numberFormatter.format(runs);
  const formattedDrops = numberFormatter.format(remaining);
  const formattedOwned = numberFormatter.format(activeMode === "fragments" ? 0 : Math.min(ownedCount, totalRequired));
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
  output.timeSub.textContent = activeMode === "fragments"
    ? `${formattedRuns}つ × 1周${minutesPerRun}分`
    : `1周${minutesPerRun}分 × ${formattedRuns}周`;
  output.runs.textContent = formattedRuns;
  output.remaining.textContent = formattedDrops;
  output.progress.textContent = `${Math.floor(progress)}%`;
  output.progressBar.setAttribute("aria-valuenow", String(Math.floor(progress)));
  output.progressFill.style.width = `${progress}%`;
  output.progressCaption.textContent = `${formattedOwned} / ${formattedTotal}${modeContent[activeMode].unit}`;
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

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    if (tab.dataset.mode === activeMode) return;

    savePlan();
    const nextMode = tab.dataset.mode;
    restorePlan(nextMode);
    applyMode(nextMode);
    try {
      localStorage.setItem(modeStorageKey, nextMode);
    } catch {
      storageNote.textContent = "タブの選択を保存できませんでした。";
      storageNote.classList.add("storage-error");
    }
  });

  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = tabs[(tabs.indexOf(tab) + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    nextTab.focus();
    nextTab.click();
  });
}

resetButton.addEventListener("click", () => {
  for (const [key, input] of Object.entries(inputs)) {
    input.value = modeContent[activeMode].defaults[key];
  }

  calculatePlan();
  savePlan();
});

try {
  const savedMode = localStorage.getItem(modeStorageKey);
  if (savedMode === "quest" || savedMode === "fragments") activeMode = savedMode;
} catch {
  storageNote.textContent = "保存データを読み込めませんでした。入力し直してください。";
  storageNote.classList.add("storage-error");
}
restorePlan(activeMode);
applyMode(activeMode);
