const WEBR_VERSION = "v0.6.0";
const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;
const CHECK_MARKER = "__OSTER_EXERCISE_CHECK__";
const STORAGE_KEY = "econometrics-oster-browser-lab-v2";
const SECTION_CELLS = {
  "regression": [
    "A01",
    "A02",
    "A03",
    "A04"
  ],
  "oster": [
    "O01",
    "O02"
  ],
  "sensitivity": [
    "S01",
    "S02"
  ]
};
const SECTION_LABELS = {
  "regression": "回帰の確認",
  "oster": "Osterの実装",
  "sensitivity": "設定の比較"
};
const CELL_GUIDANCE = {
  "A01": "2,000人の標本を使う。incomeとprior_incomeは万円、experienceは年である。",
  "A02": "参加の係数は6.0から5.4万円へ動く。どちらも2,000人で推定している。",
  "A03": "係数は6.0と5.4、R²は0.10と0.30。R²は0.20（20ポイント）増えている。",
  "A04": "二つの青い点は観察された回帰結果。線は変化を見やすくするために引いている。",
  "O01": "beta*は約4.190万円。Uncontrolled／Controlled Coefficientは6.0／5.4、R-squareは0.10／0.30である。",
  "O02": "delta*は約3.817。Rmax＝0.70、目標の係数をゼロとした場合の値である。beta hatの行が0であることも確認する。",
  "S01": "初期値0.39では補正後の係数が約5.129万円、ゼロに対応するδが約10.761となる。他のRmaxに変更したら、実際の出力値を読む。",
  "S02": "Rmaxを0.39から1.00へ変えると、補正後の係数は約5.129から3.274万円、ゼロに対応するδは約10.761から2.349へ変わる。いずれも指定したモデルと仮定のもとでの結果である。"
};
const CELL_PREDICTIONS = {
  "A01": "行数、参加の0／1、月収と職歴の単位を確認する。",
  "A02": "二つの出力でparticipateの係数とMultiple R-squaredを見比べる。",
  "A03": "bは係数、rはR²を表す名前として使う。表を報告の基礎にする。",
  "A04": "右に0.20進んだとき、係数が0.6下がることを図で確認する。",
  "O01": "δ＝1、Rmax＝0.70を指定して実行する。beta*の行を読み、元の係数とR²もA03と一致するか確認する。",
  "O02": "Rmax＝0.70を固定し、beta＝0を指定する。今度はdeltaを入力せず、出力として読む。",
  "S01": "r_maxの1行を変更する。出力のRmaxと、二つの結果が一緒に変わることを確認する。",
  "S02": "コードをそのまま実行する。2枚の図で、Rmaxを大きくしたときにそれぞれの結果がどう変わるか確認する。"
};
const EXERCISE_HINTS = {};
const DATA_FILES = [
  "pattern_a.csv"
];
const DATA_SETUP = {
  "pattern_a": "raw <- read.csv(\"/home/web_user/pattern_a.csv\", stringsAsFactors = FALSE)"
};

const cells = [...document.querySelectorAll(".r-cell")];
const cellsById = new Map(cells.map((cell) => [cell.dataset.cellId, cell]));
const runButtons = [...document.querySelectorAll(".run-button")];
const statusDot = document.getElementById("status-dot");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");
const restartButton = document.getElementById("restart-button");
const resumeButton = document.getElementById("resume-button");
const heroResumeButton = document.getElementById("hero-resume-button");
const previousStepButton = document.getElementById("previous-step-button");
const nextStepButton = document.getElementById("next-step-button");
const currentStep = document.getElementById("current-step");
const completedCount = document.getElementById("completed-count");
const totalCount = document.getElementById("total-count");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");
const flowSections = [...document.querySelectorAll("[data-flow-section]")];
const flowItems = [...document.querySelectorAll("[data-flow-item]")];
const flowList = document.getElementById("flow-list");
const flowMobileCurrent = document.getElementById("flow-mobile-current");

let webR = null;
let runtimeReady = false;
const loadedPackages = new Set();
let runtimeBusy = false;
let resettingLearningState = false;
let currentVisibleCellId = null;
const completedCells = new Set();
let learningState = loadLearningState();
function activeCells() { return cells; }

totalCount.textContent = String(cells.length);
progressTrack?.setAttribute("aria-valuemax", String(cells.length));

for (const cell of cells) {
  const textarea = cell.querySelector("textarea");
  const runButton = cell.querySelector(".run-button");
  const restoreButton = cell.querySelector(".restore-button");

  textarea.dataset.initialCode = textarea.value;
  const savedCode = learningState.codes?.[cell.dataset.cellId];
  if (typeof savedCode === "string") textarea.value = savedCode;
  runButton.dataset.idleLabel = runButton.textContent;
  const lessonCard = cell.closest(".lesson-card");
  if (lessonCard) lessonCard.id = `cell-${cell.dataset.cellId}`;
  else cell.id = `cell-${cell.dataset.cellId}`;
  textarea.wrap = "off";
  initializeCellFrame(cell);
  initializeEditor(textarea);
  initializeAnswerControls(cell, textarea);
  if (learningState.completed?.includes(cell.dataset.cellId)) {
    completedCells.add(cell.dataset.cellId);
    cell.classList.add("is-complete", "is-restored-complete");
    updateCellStateLabel(cell, "前回の実行記録あり。必要に応じて再実行できます。");
  }
  resizeTextarea(textarea);

  textarea.addEventListener("input", () => {
    invalidateCellResult(cell);
    updateEditorHighlight(textarea);
    resizeTextarea(textarea);
  });
  textarea.addEventListener("scroll", () => syncEditorScroll(textarea));
  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (runtimeReady && !runtimeBusy) runCell(cell);
    }
  });

  runButton.addEventListener("click", () => runCell(cell));
  restoreButton.addEventListener("click", () => restoreCell(cell));
}

const hasSavedWork = completedCells.size > 0 || Object.keys(learningState.codes || {}).length > 0;
resumeButton.hidden = !hasSavedWork;
heroResumeButton.hidden = !hasSavedWork;

resumeButton.addEventListener("click", resumeLearning);
heroResumeButton.addEventListener("click", resumeLearning);
previousStepButton.addEventListener("click", scrollToPreviousCell);
nextStepButton.addEventListener("click", scrollToNextIncompleteCell);
restartButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "すべての入力、実行結果、進捗を消して最初からやり直しますか。\nこのページ以外には影響しません。"
  );
  if (confirmed) {
    // A queued scroll observer must not restore old progress during reload.
    resettingLearningState = true;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(`${STORAGE_KEY}-report`);
    window.localStorage.removeItem("econometrics-oster-browser-lab-v1-report");
    window.location.reload();
  }
});

updateProgress({ save: false });
initializeFlowRail();
initializeWebR();

async function initializeWebR() {
  if (window.location.protocol === "file:") {
    setRuntimeError(
      "このファイルは直接開けません",
      "授業用URLから開いてください。作成者はREADMEの方法でローカルサーバーを起動します"
    );
    return;
  }

  try {
    setRuntimeLoading("R本体をダウンロード中", "初回は30秒から1分ほどかかります");
    const { WebR } = await import(WEBR_MODULE_URL);
    webR = new WebR({ baseUrl: WEBR_BASE_URL });
    await webR.init();

    await webR.evalRVoid('options(width = 92, digits = 4, warn = 1)');
    setRuntimeLoading("データを準備中", "職業訓練の教育用データを読み込んでいます");
    await loadDataFiles();
    await warmUpGraphicsDevice();

    runtimeReady = true;
    setButtonsDisabled(false);
    setRuntimeReady();
  } catch (error) {
    console.error(error);
    setRuntimeError(
      "Rを起動できませんでした",
      "通信を確認して再読み込みしてください。改善しなければChromeまたはFirefoxで開いてください"
    );
  }
}

async function loadDataFiles() {
  for (const filename of DATA_FILES) {
    const response = await fetch(`data/${filename}`);
    if (!response.ok) {
      throw new Error(`${filename}を読み込めませんでした`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    await webR.FS.writeFile(`/home/web_user/${filename}`, bytes);
  }
}

async function warmUpGraphicsDevice() {
  const warmup = await new webR.Shelter();
  try {
    await warmup.captureR("plot.new()", {
      captureGraphics: {
        width: 820,
        height: 500,
        pointsize: 13,
        bg: "white",
        capture: true
      }
    });
  } finally {
    await warmup.purge();
  }
}

async function runCell(cell) {
  if (!runtimeReady || runtimeBusy) return;

  const textarea = cell.querySelector("textarea");
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");
  const button = cell.querySelector(".run-button");
  const code = textarea.value.trim();
  const datasetCode = DATA_SETUP[cell.dataset.dataset] || "";
  const setupCode = cell.querySelector(".r-setup")?.textContent.trim() ?? "";
  const checkCode = cell.querySelector(".r-check")?.textContent.trim() ?? "";

  if (!code) {
    showCellError(cell, "コードが空欄です。入力するか「元に戻す」を押してください。");
    return;
  }

  const unfilledPositions = [...code.matchAll(/__/g)].map((match) => match.index);
  if (unfilledPositions.length > 0) {
    const firstBlank = unfilledPositions[0];
    showCellError(
      cell,
      `未入力の __ が${unfilledPositions.length}か所あります。「ヒントを見る」からヒントを参照できます。\nRを実行する前に、最初の __ を選択しました。`
    );
    textarea.focus();
    textarea.setSelectionRange(firstBlank, firstBlank + 2);
    updateCellStateLabel(cell, `未入力が${unfilledPositions.length}か所あります。`);
    return;
  }

  runtimeBusy = true;
  setButtonsDisabled(true);
  cell.classList.remove("has-error", "needs-revision");
  updateCellStateLabel(cell, "Rで計算しています…");
  cell.classList.add("is-running");
  button.textContent = "実行中…";
  outputBox.hidden = false;
  textOutput.classList.remove("is-error");
  textOutput.textContent = "Rが計算しています…";
  plotOutput.replaceChildren();
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
  setRuntimeLoading("コードを実行中", `セル ${cell.dataset.cellId} を計算しています`);

  let shelter = null;
  try {
    if (cell.dataset.package && !loadedPackages.has(cell.dataset.package)) {
      setRuntimeLoading("Osterのパッケージを準備中", "robomitと依存パッケージを取得しています。数分かかる場合があります");
      textOutput.textContent = "robomitを準備しています…";
      await webR.installPackages([cell.dataset.package]);
      loadedPackages.add(cell.dataset.package);
    }
    shelter = await new webR.Shelter();
    const cellEnvironment = await shelter.evalR("new.env(parent = globalenv())");
    const dependencyCode = resolveDependencyCode(cell);
    const prerequisiteCode = [datasetCode, dependencyCode]
      .filter(Boolean)
      .join("\n");

    if (prerequisiteCode) {
      const prepared = await shelter.captureR(prerequisiteCode, {
        env: cellEnvironment,
        withAutoprint: false,
        captureStreams: true,
        captureConditions: true,
        captureGraphics: false
      });
      if (prepared.output.some((entry) => entry.type === "error")) throw new Error("準備コードを実行できませんでした");
    }

    const checkCommand = checkCode
      ? `cat("\\n${CHECK_MARKER}:", if (isTRUE({${checkCode}})) "PASS" else "FAIL", "\\n")`
      : "";
    const executableCode = [setupCode, code, checkCommand]
      .filter(Boolean)
      .join("\n");

    const capture = await shelter.captureR(executableCode, {
      env: cellEnvironment,
      withAutoprint: true,
      captureStreams: true,
      captureConditions: true,
      captureGraphics: {
        width: 820,
        height: 500,
        pointsize: 13,
        bg: "white",
        capture: true
      }
    });

    const lines = [];
    for (const entry of capture.output) {
      const line = await formatOutputEntry(entry);
      if (line) lines.push(line);
    }
    const joinedOutput = lines.join("\n");
    const checkMatch = joinedOutput.match(
      new RegExp(`${CHECK_MARKER}:\\s*(PASS|FAIL)`)
    );
    const visibleOutput = joinedOutput
      .replace(new RegExp(`\\n?${CHECK_MARKER}:\\s*(?:PASS|FAIL)\\n?`, "g"), "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const checkPassed = !checkCode || checkMatch?.[1] === "PASS";
    const requiredPlotCreated = cell.dataset.requiresPlot !== "true"
      || capture.images.length >= Number(cell.dataset.minPlots || 1);
    const hadRError = capture.output.some((entry) => entry.type === "error");
    const exercisePassed = checkPassed && requiredPlotCreated && !hadRError;

    textOutput.textContent = visibleOutput;
    textOutput.classList.toggle(
      "is-error",
      capture.output.some((entry) => entry.type === "stderr" || entry.type === "warning")
    );

    for (const image of capture.images) {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `セル${cell.dataset.cellId}でRが作成した図`);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);
      plotOutput.append(canvas);
    }

    if (!visibleOutput && capture.images.length === 0) {
      textOutput.textContent = cell.dataset.emptyOutput || "（表示される結果はありません）";
    }

    if (checkCode) renderCheckResult(cell, exercisePassed);

    if (exercisePassed) {
      cell.classList.add("is-complete");
      cell.classList.remove("needs-revision", "is-restored-complete");
      completedCells.add(cell.dataset.cellId);
      updateCellStateLabel(cell, "実行完了。以下の確認項目を参照してください。");
    } else {
      cell.classList.remove("is-complete");
      cell.classList.add("needs-revision");
      completedCells.delete(cell.dataset.cellId);
      updateCellStateLabel(cell, "要修正。判定結果とヒントを確認してください。");
    }
    updateProgress();
  } catch (error) {
    console.error(error);
    showCellError(cell, friendlyError(error));
  } finally {
    if (shelter) {
      try {
        await shelter.purge();
      } catch (purgeError) {
        console.warn("webR shelter cleanup failed", purgeError);
      }
    }

    runtimeBusy = false;
    cell.classList.remove("is-running");
    button.textContent = button.dataset.idleLabel || "実行";
    setButtonsDisabled(false);
    setRuntimeReady();
  }
}

function resolveDependencyCode(cell) {
  const resolved = [];
  const visited = new Set();
  const active = new Set();

  const visit = (target) => {
    const targetId = target.dataset.cellId;
    if (visited.has(targetId)) return;
    if (active.has(targetId)) {
      throw new Error(`セルの準備関係が循環しています: ${targetId}`);
    }

    active.add(targetId);
    const dependencyIds = (target.dataset.dependsOn || "")
      .split(/\s+/)
      .filter(Boolean);
    for (const dependencyId of dependencyIds) {
      const dependency = cellsById.get(dependencyId);
      if (!dependency) throw new Error(`準備セルが見つかりません: ${dependencyId}`);
      visit(dependency);
    }

    active.delete(targetId);
    visited.add(targetId);
    const answerCode = target.querySelector(".r-answer")?.textContent.trim();
    const initialCode = target.querySelector("textarea")?.dataset.initialCode;
    const targetCode = answerCode || initialCode;
    if (targetCode) resolved.push(targetCode);
  };

  const directDependencyIds = (cell.dataset.dependsOn || "")
    .split(/\s+/)
    .filter(Boolean);
  for (const dependencyId of directDependencyIds) {
    const dependency = cellsById.get(dependencyId);
    if (!dependency) throw new Error(`準備セルが見つかりません: ${dependencyId}`);
    visit(dependency);
  }

  return resolved.join("\n");
}

function restoreCell(cell) {
  const textarea = cell.querySelector("textarea");
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");

  textarea.value = textarea.dataset.initialCode;
  updateEditorHighlight(textarea);
  resizeTextarea(textarea);
  outputBox.hidden = true;
  textOutput.textContent = "";
  textOutput.classList.remove("is-error");
  plotOutput.replaceChildren();
  cell.classList.remove("has-error", "needs-revision", "is-complete", "is-restored-complete");
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
  closeAnswerPanel(cell);
  completedCells.delete(cell.dataset.cellId);
  updateCellStateLabel(cell, "初期状態へ戻しました。");
  updateProgress();
  textarea.focus();
}

function invalidateCellResult(cell) {
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");

  outputBox.hidden = true;
  textOutput.textContent = "";
  textOutput.classList.remove("is-error");
  plotOutput.replaceChildren();
  cell.classList.remove("has-error", "needs-revision", "is-complete", "is-restored-complete");
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
  completedCells.delete(cell.dataset.cellId);
  updateCellStateLabel(cell, "編集中。実行すると判定と注目点が表示されます。");
  updateProgress();
}

function showCellError(cell, message) {
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");

  cell.classList.add("has-error");
  cell.classList.remove("is-complete", "needs-revision");
  completedCells.delete(cell.dataset.cellId);
  updateCellStateLabel(cell, "実行エラー。内容を確認して修正してください。");
  updateProgress();
  outputBox.hidden = false;
  textOutput.classList.add("is-error");
  textOutput.textContent = `エラー\n${message}`;
  plotOutput.replaceChildren();
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
}

function renderCheckResult(cell, passed) {
  const checkOutput = cell.querySelector(".check-output");
  if (!checkOutput) return;

  const message = passed
    ? cell.dataset.checkSuccess || "判定条件を満たしています。"
    : cell.dataset.checkFailure || "依頼されたobjectと値を確認してください。";
  checkOutput.hidden = false;
  checkOutput.className = `check-output check-output--${passed ? "pass" : "retry"}`;
  checkOutput.textContent = `${passed ? "判定　条件を満たしています" : "判定　要修正"}\n${message}`;
}

function friendlyError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw
    .replace(/^Error:\s*/i, "")
    .replace(/^WebAssembly error:\s*/i, "")
    .trim();
  let recovery = "上から一行ずつ、object名、半角の括弧、カンマ、列名と設定値を確認してください。";
  if (/object .* not found|オブジェクト.*ありません/i.test(cleaned)) {
    recovery = "objectがまだ作られていないか、名前が違います。<- の左側と、そのobjectを使う行の綴りを比べてください。";
  } else if (/unexpected (input|symbol)|unexpected end/i.test(cleaned)) {
    recovery = "構文解析エラーです。括弧の閉じ忘れ、カンマ、演算子、全角記号を確認してください。";
  } else if (/could not find function|関数.*見つかりません/i.test(cleaned)) {
    recovery = "関数名の綴りと()を確認してください。回帰はlm()、図はplot()を使います。";
  } else if (/undefined columns|存在しない列|unknown column/i.test(cleaned)) {
    recovery = "列名がdataにありません。上の対応表かnames(data)の出力と綴りを比べてください。";
  } else if (/need finite ['\"]xlim['\"] values|finite.*xlim/i.test(cleaned)) {
    recovery = "横軸に渡すR²やdeltaの値が有限の数値になっているか確認してください。";
  } else if (/['\"]x['\"] and ['\"]y['\"] lengths differ|x.*y.*lengths differ/i.test(cleaned)) {
    recovery = "横軸と縦軸の行数が一致していません。対応する同じ長さの数値の並びを渡してください。subset()を使った場合は両方の列を同じ部分標本から選びます。";
  } else if (/cutoff|bandwidth|not enough|invertible/i.test(cleaned)) {
    recovery = "R²の増加が正か、Rmaxが調整したR²以上かを確認してください。";
  }
  return `${cleaned}\n\n確認事項\n${recovery}`;
}

async function formatOutputEntry(entry) {
  if (!entry) return "";
  const prefix = entry.type === "warning"
    ? "警告: "
    : entry.type === "message"
      ? "メッセージ: "
      : "";
  const formatText = (value) => {
    const content = String(value);
    const normalized = entry.type === "warning" || entry.type === "message"
      ? content.trimEnd()
      : content;
    return `${prefix}${normalized}`;
  };
  const data = entry.data;
  if (typeof data === "string") return formatText(data);
  if (data && typeof data.message === "string") return formatText(data.message);
  if (data && typeof data.get === "function") {
    try {
      const message = await data.get("message");
      const values = await message.toArray();
      const conditionText = Array.from(values)[0];
      if (conditionText !== undefined && conditionText !== null) {
        return formatText(conditionText);
      }
    } catch {
      // Not every R object contains a message field. Use the fallback below.
    }
  }
  try {
    return `${prefix}${JSON.stringify(data)}`;
  } catch {
    return `${prefix}${String(data)}`;
  }
}

function setButtonsDisabled(disabled) {
  for (const button of runButtons) button.disabled = disabled;
  const editingDisabled = disabled && runtimeBusy;
  for (const button of document.querySelectorAll(".restore-button, .use-answer-button")) {
    button.disabled = editingDisabled;
  }
  for (const textarea of document.querySelectorAll(".r-cell textarea")) {
    textarea.readOnly = editingDisabled;
  }
  if (restartButton) restartButton.disabled = editingDisabled;
}

function updateProgress({ save = true } = {}) {
  const selected = activeCells();
  const completed = selected.filter(cell => completedCells.has(cell.dataset.cellId)).length;
  const total = selected.length;
  totalCount.textContent = String(total);
  progressTrack?.setAttribute("aria-valuemax", String(total));
  completedCount.textContent = String(completed);
  progressFill.style.width = `${(completed / total) * 100}%`;
  progressTrack?.setAttribute("aria-valuenow", String(completed));
  updateSectionCompletion();
  nextStepButton.disabled = completed === total;
  updateNextStepButtonLabel();
  if (save) saveLearningState();
}

function updateNextStepButtonLabel() {
  if (activeCells().every(cell => completedCells.has(cell.dataset.cellId))) {
    nextStepButton.textContent = `全${activeCells().length}セル完了`;
    return;
  }
  const currentCellIncomplete = activeCells().some(cell => cell.dataset.cellId === currentVisibleCellId) && !completedCells.has(currentVisibleCellId);
  nextStepButton.textContent = currentCellIncomplete ? "現在の未完了セルへ" : "次の未完了セルへ";
}

function updateSectionCompletion() {
  for (const item of flowItems) {
    const sectionId = item.dataset.flowItem;
    const requirements = SECTION_CELLS[sectionId];
    const complete = Boolean(
      requirements?.length && requirements.every((cellId) => completedCells.has(cellId))
    );
    item.classList.toggle("is-complete", complete);
  }

  const completionGroups = SECTION_CELLS;
  for (const block of document.querySelectorAll("[data-completion-section]")) {
    const requirements = completionGroups[block.dataset.completionSection] || [];
    block.hidden = !requirements.every((cellId) => completedCells.has(cellId));
  }
}

function setRuntimeLoading(title, detail) {
  statusDot.className = "status-dot status-dot--loading";
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
}

function setRuntimeReady() {
  statusDot.className = "status-dot status-dot--ready";
  statusTitle.textContent = "Rの準備完了";
  statusDetail.textContent = "Rセルを実行できます";
}

function setRuntimeError(title, detail) {
  runtimeReady = false;
  setButtonsDisabled(true);
  statusDot.className = "status-dot status-dot--error";
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
}

function loadLearningState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      codes: parsed.codes && typeof parsed.codes === "object" ? parsed.codes : {},
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      lastCellId: typeof parsed.lastCellId === "string" ? parsed.lastCellId : null,
      savedAt: parsed.savedAt || null
    };
  } catch (error) {
    console.warn("保存した学習記録を読み込めませんでした", error);
    return { codes: {}, completed: [], lastCellId: null, savedAt: null };
  }
}

function saveLearningState() {
  if (resettingLearningState) return;
  const codes = {};
  for (const cell of cells) {
    const textarea = cell.querySelector("textarea");
    if (textarea.value !== textarea.dataset.initialCode) {
      codes[cell.dataset.cellId] = textarea.value;
    }
  }
  learningState = {
    codes,
    completed: [...completedCells],
    lastCellId: currentVisibleCellId || learningState.lastCellId || null,
    savedAt: new Date().toISOString()
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learningState));
    const hasWork = learningState.completed.length > 0 || Object.keys(codes).length > 0;
    resumeButton.hidden = !hasWork;
    heroResumeButton.hidden = !hasWork;
  } catch (error) {
    console.warn("学習記録を保存できませんでした", error);
  }
}

function resumeLearning() {
  const savedCell = cellsById.get(learningState.lastCellId);
  if (savedCell) {
    scrollToCell(savedCell);
    return;
  }
  scrollToNextIncompleteCell();
}

function scrollToNextIncompleteCell() {
  const selected = activeCells();
  const currentIndex = cells.findIndex(cell => cell.dataset.cellId === currentVisibleCellId);
  const target = selected.find(cell => cells.indexOf(cell) >= currentIndex && !completedCells.has(cell.dataset.cellId))
    || selected.find(cell => !completedCells.has(cell.dataset.cellId));
  if (target) scrollToCell(target);
  else document.getElementById("summary")?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
}

function scrollToPreviousCell() {
  const currentIndex = cells.findIndex(cell => cell.dataset.cellId === currentVisibleCellId);
  const earlier = activeCells().filter(cell => cells.indexOf(cell) < currentIndex);
  const target = earlier.at(-1) || activeCells()[0];
  if (target) scrollToCell(target);
}

function scrollToCell(cell) {
  cell.closest(".lesson-card")?.scrollIntoView({
    behavior: preferredScrollBehavior(),
    block: "start"
  });
  currentVisibleCellId = cell.dataset.cellId;
  learningState.lastCellId = currentVisibleCellId;
  updateCurrentCell(cell.closest("[data-flow-section]"));
  saveLearningState();
}

function preferredScrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function updateCurrentCell(currentSection) {
  const sectionId = currentSection?.dataset.flowSection;
  const sectionCells = cells.filter(
    (cell) => cell.closest("[data-flow-section]")?.dataset.flowSection === sectionId
  );
  const activationLine = Math.min(window.innerHeight * 0.34, 290);
  let visibleCell = null;
  for (const cell of sectionCells) {
    if (cell.closest(".lesson-card").getBoundingClientRect().top <= activationLine) {
      visibleCell = cell;
    } else {
      break;
    }
  }

  if (!visibleCell) {
    currentVisibleCellId = null;
    previousStepButton.disabled = true;
    const flowLabel = flowItems.find((item) => item.dataset.flowItem === sectionId)
      ?.querySelector(".flow-rail__text")?.textContent;
    currentStep.textContent = flowLabel ? `${flowLabel}を読んでいます` : "現在地を確認中";
    updateNextStepButtonLabel();
    return;
  }

  const previousCellId = currentVisibleCellId;
  currentVisibleCellId = visibleCell.dataset.cellId;
  previousStepButton.disabled = cells.indexOf(visibleCell) === 0;
  const position = getCellCoursePosition(currentVisibleCellId);
  const title = visibleCell.closest(".lesson-card")?.querySelector("h3")?.textContent || "Rセル";
  currentStep.textContent = `${position.label} ${position.index}/${position.total} · ${currentVisibleCellId} ${title}`;
  updateNextStepButtonLabel();
  learningState.lastCellId = currentVisibleCellId;
  if (previousCellId !== currentVisibleCellId && (completedCells.size > 0 || Object.keys(learningState.codes || {}).length > 0)) {
    saveLearningState();
  }
}

function getCellCoursePosition(cellId) {
  for (const [section, ids] of Object.entries(SECTION_CELLS)) {
    if (ids.includes(cellId)) {
      return {label: `第14回 ${SECTION_LABELS[section]}`, index: ids.indexOf(cellId)+1, total: ids.length};
    }
  }
  return {label: "第14回", index: 0, total: 0};
}

function initializeFlowRail() {
  if (flowSections.length === 0 || flowItems.length === 0) return;
  let updateQueued = false;
  const scheduleUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(() => {
      updateQueued = false;
      updateCurrentFlow();
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: "-22% 0px -66% 0px",
      threshold: [0, 0.01, 1]
    });
    for (const section of flowSections) observer.observe(section);
  }
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  updateCurrentFlow();
}

function updateCurrentFlow() {
  const activationLine = Math.min(window.innerHeight * 0.3, 260);
  let currentSection = flowSections[0];
  for (const section of flowSections) {
    if (section.getBoundingClientRect().top <= activationLine) {
      currentSection = section;
    } else {
      break;
    }
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    currentSection = flowSections.at(-1);
  }
  setCurrentFlow(currentSection.dataset.flowSection);
  updateCurrentCell(currentSection);
}

function setCurrentFlow(flowId) {
  const currentIndex = flowItems.findIndex((item) => item.dataset.flowItem === flowId);
  if (currentIndex < 0) return;

  for (const [index, item] of flowItems.entries()) {
    const link = item.querySelector("a");
    const isCurrent = index === currentIndex;
    item.classList.toggle("is-current", isCurrent);
    if (isCurrent) link?.setAttribute("aria-current", "step");
    else link?.removeAttribute("aria-current");
  }

  const currentLabel = flowItems[currentIndex]
    .querySelector(".flow-rail__text")
    ?.textContent;
  if (flowMobileCurrent && currentLabel) flowMobileCurrent.textContent = currentLabel;

  if (window.innerWidth <= 1320 && flowList) {
    const currentItem = flowItems[currentIndex];
    const left = Math.max(
      0,
      currentItem.offsetLeft - (flowList.clientWidth - currentItem.offsetWidth) / 2
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    flowList.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
  }
}

function initializeCellFrame(cell) {
  const cellId = cell.dataset.cellId;
  const position = getCellCoursePosition(cellId);
  const isScratch = cell.closest(".lesson-card")?.classList.contains("lesson-card--scratch");
  const isExercise = cell.classList.contains("r-cell--exercise");
  const mode = isScratch ? "指示入力" : isExercise ? "穴埋め" : "完成コード";
  const dependencyIds = (cell.dataset.dependsOn || "").split(/\s+/).filter(Boolean);

  const routine = document.createElement("div");
  routine.className = "cell-routine";
  const meta = document.createElement("div");
  meta.className = "cell-routine__meta";
  const stage = document.createElement("span");
  stage.textContent = `${position.label} ${position.index}/${position.total}`;
  const modeLabel = document.createElement("strong");
  modeLabel.textContent = mode;
  meta.append(stage, modeLabel);

  const steps = document.createElement("p");
  steps.textContent = isExercise
    ? "①課題を確認　②Editorへ入力　③実行ボタンを選択　④判定結果と確認項目を参照"
    : "①目的を確認　②コードの役割を確認　③実行ボタンを選択　④Outputの確認項目を参照";
  const dependency = document.createElement("small");
  dependency.className = "cell-dependency";
  dependency.textContent = dependencyIds.length
    ? `前提セル ${dependencyIds.join("・")} の正しい準備コードは、このセル内で自動実行されます。`
    : cell.dataset.dataset === "practice" ? "この練習は数だけで実行できます。ほかのセルの実行は不要です。" : "データはこのセル専用のR環境へ自動で準備されます。";
  const state = document.createElement("span");
  state.className = "cell-state-label";
  state.setAttribute("aria-live", "polite");
  state.textContent = "未実行";
  const prediction = document.createElement("div");
  prediction.className = "cell-prediction";
  const predictionLabel = document.createElement("strong");
  predictionLabel.textContent = "実行前の確認";
  const predictionText = document.createElement("span");
  predictionText.textContent = CELL_PREDICTIONS[cellId] || "確認する数値または符号を特定する。";
  prediction.append(predictionLabel, predictionText);
  const commentKey = document.createElement("small");
  commentKey.className = "editor-comment-key";
  commentKey.textContent = "Editor内の明るい緑色の行（#）は、その直後のコードの説明です。Rは#以降を実行しません。";
  routine.append(meta, steps, prediction, commentKey, dependency, state);
  cell.prepend(routine);

  const output = cell.querySelector(".r-output");
  const outputLabel = output?.querySelector(".r-output__label");
  if (output && outputLabel) {
    const guide = document.createElement("div");
    guide.className = "output-reading-guide";
    const guideTitle = document.createElement("strong");
    guideTitle.textContent = "Outputで見る場所";
    const guideText = document.createElement("span");
    guideText.textContent = CELL_GUIDANCE[cellId] || "実行前の目的に戻り、必要な数値や図の動きを一つずつ確認する。";
    guide.append(guideTitle, guideText);
    outputLabel.after(guide);
  }
}

function updateCellStateLabel(cell, message) {
  const label = cell.querySelector(".cell-state-label");
  if (label) label.textContent = message;
}

function resizeTextarea(textarea) {
  const cell = textarea.closest(".r-cell");
  const minimumHeight = cell?.classList.contains("r-cell--single") ? 74 : 130;
  const maximumHeight = cell?.classList.contains("r-cell--long") ? 2400 : 1000;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(
    Math.max(textarea.scrollHeight + 2, minimumHeight),
    maximumHeight
  )}px`;
  syncEditorScroll(textarea);
}

function initializeEditor(textarea) {
  const shell = document.createElement("div");
  shell.className = "editor-shell";
  const highlight = document.createElement("pre");
  highlight.className = "editor-highlight";
  highlight.setAttribute("aria-hidden", "true");
  textarea.before(shell);
  shell.append(highlight, textarea);
  const scrollHint = document.createElement("small");
  scrollHint.className = "code-scroll-hint";
  scrollHint.textContent = "コードが見切れるときは、Editor内を横にスクロール →";
  shell.after(scrollHint);
  updateEditorHighlight(textarea);
}

function updateEditorHighlight(textarea) {
  const highlight = textarea.previousElementSibling;
  if (!highlight?.classList.contains("editor-highlight")) return;
  const code = textarea.value;
  highlight.innerHTML = `${highlightRCode(code)}${code.endsWith("\n") ? " " : "\n"}`;
  syncEditorScroll(textarea);
}

function syncEditorScroll(textarea) {
  const highlight = textarea.previousElementSibling;
  if (!highlight?.classList.contains("editor-highlight")) return;
  highlight.scrollTop = textarea.scrollTop;
  highlight.scrollLeft = textarea.scrollLeft;
}

function highlightRCode(source) {
  return source
    .split("\n")
    .map((line) => {
      let quote = null;
      let escaped = false;
      let commentStart = -1;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (character === "\\" && quote) {
          escaped = true;
          continue;
        }
        if ((character === '"' || character === "'") && !quote) {
          quote = character;
          continue;
        }
        if (character === quote) {
          quote = null;
          continue;
        }
        if (character === "#" && !quote) {
          commentStart = index;
          break;
        }
      }
      if (commentStart < 0) return escapeHtml(line);
      const code = escapeHtml(line.slice(0, commentStart));
      const comment = escapeHtml(line.slice(commentStart));
      return `${code}<span class="code-comment">${comment}</span>`;
    })
    .join("\n");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function initializeAnswerControls(cell, textarea) {
  const answerSource = cell.querySelector(".r-answer")?.textContent.trim();
  if (!answerSource) return;

  const cellId = cell.dataset.cellId;
  const hints = EXERCISE_HINTS[cellId] || [
    "依頼文を、結果・処置・統制変数・保存先の役割に分ける。",
    cell.dataset.checkFailure || "前の完成コードと、使う列名を一つずつ対応させる。"
  ];
  const actions = cell.querySelector(".r-cell__actions");
  const output = cell.querySelector(".r-output");
  const answerButton = document.createElement("button");
  const panel = document.createElement("div");
  const panelTitle = document.createElement("strong");
  const hintCopy = document.createElement("p");
  const nextHintButton = document.createElement("button");
  const answerCode = document.createElement("pre");
  const useAnswerButton = document.createElement("button");

  answerButton.className = "button button--answer answer-button";
  answerButton.type = "button";
  answerButton.textContent = "ヒントを見る";
  answerButton.setAttribute("aria-expanded", "false");
  answerButton.setAttribute("aria-controls", `answer-${cellId}`);

  panel.className = "answer-panel support-panel";
  panel.id = `answer-${cellId}`;
  panel.hidden = true;
  panel.dataset.stage = "1";
  hintCopy.className = "support-copy";
  nextHintButton.className = "button button--answer support-next-button";
  nextHintButton.type = "button";
  answerCode.className = "answer-code";
  answerCode.innerHTML = highlightRCode(answerSource);
  answerCode.hidden = true;
  useAnswerButton.className = "button button--quiet use-answer-button";
  useAnswerButton.type = "button";
  useAnswerButton.textContent = "解答例をEditorに入れる";
  useAnswerButton.hidden = true;

  const renderSupportStage = () => {
    const stage = Number(panel.dataset.stage);
    if (stage === 1) {
      panelTitle.textContent = "ヒント1";
      hintCopy.textContent = hints[0];
      hintCopy.hidden = false;
      nextHintButton.hidden = false;
      nextHintButton.textContent = "ヒント2を見る";
      answerCode.hidden = true;
      useAnswerButton.hidden = true;
    } else if (stage === 2) {
      panelTitle.textContent = "ヒント2";
      hintCopy.textContent = hints[1];
      hintCopy.hidden = false;
      nextHintButton.hidden = false;
      nextHintButton.textContent = "解答例を見る";
      answerCode.hidden = true;
      useAnswerButton.hidden = true;
    } else {
      panelTitle.textContent = "解答例";
      hintCopy.textContent = "入力コードと解答例について、関数、列名、保存先のobject名を比較します。";
      hintCopy.hidden = false;
      nextHintButton.hidden = true;
      answerCode.hidden = false;
      useAnswerButton.hidden = false;
    }
  };
  renderSupportStage();

  answerButton.addEventListener("click", () => {
    const shouldOpen = panel.hidden;
    panel.hidden = !shouldOpen;
    answerButton.setAttribute("aria-expanded", String(shouldOpen));
    answerButton.textContent = shouldOpen ? "ヒントを閉じる" : "ヒントを見る";
  });

  nextHintButton.addEventListener("click", () => {
    panel.dataset.stage = String(Math.min(3, Number(panel.dataset.stage) + 1));
    renderSupportStage();
  });

  useAnswerButton.addEventListener("click", () => {
    textarea.value = answerSource;
    invalidateCellResult(cell);
    updateEditorHighlight(textarea);
    resizeTextarea(textarea);
    textarea.focus();
  });

  panel.append(panelTitle, hintCopy, nextHintButton, answerCode, useAnswerButton);
  actions.append(answerButton);
  cell.insertBefore(panel, output);
}

function closeAnswerPanel(cell) {
  const panel = cell.querySelector(".answer-panel");
  const button = cell.querySelector(".answer-button");
  if (!panel || !button) return;
  panel.hidden = true;
  button.setAttribute("aria-expanded", "false");
  button.textContent = "ヒントを見る";
}

// Report writing is independent of automatic code-completion checks.
const reportNotes = document.getElementById("report-notes");
const reportStatus = document.getElementById("report-save-status");
try { reportNotes.value = localStorage.getItem(`${STORAGE_KEY}-report`) ?? localStorage.getItem("econometrics-oster-browser-lab-v1-report") ?? ""; }
catch { reportStatus.textContent = "自動保存を利用できません。テキストで保存してください。"; }
reportNotes.addEventListener("input", () => {
  try {
    localStorage.setItem(`${STORAGE_KEY}-report`, reportNotes.value);
    reportStatus.textContent = "このブラウザに保存しました";
  } catch { reportStatus.textContent = "自動保存できません。テキストで保存してください。"; }
});
document.getElementById("download-report").addEventListener("click", () => {
  const blob = new Blob(["第14回：係数の安定性と未観察交絡\n\n", reportNotes.value], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lecture14-report.txt";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
