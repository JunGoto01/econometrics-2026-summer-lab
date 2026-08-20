const WEBR_VERSION = "v0.6.0";
const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;

const cells = [...document.querySelectorAll(".r-cell")];
const runButtons = [...document.querySelectorAll(".run-button")];
const statusDot = document.getElementById("status-dot");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");
const completedCount = document.getElementById("completed-count");
const totalCount = document.getElementById("total-count");
const progressFill = document.getElementById("progress-fill");
const restartButton = document.getElementById("restart-button");

let webR = null;
let runtimeReady = false;
let runtimeBusy = false;
const completedCells = new Set();

totalCount.textContent = String(cells.length);

for (const cell of cells) {
  const textarea = cell.querySelector("textarea");
  const runButton = cell.querySelector(".run-button");
  const restoreButton = cell.querySelector(".restore-button");

  textarea.dataset.initialCode = textarea.value;
  textarea.wrap = "off";
  resizeTextarea(textarea);

  textarea.addEventListener("input", () => resizeTextarea(textarea));
  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (runtimeReady && !runtimeBusy) runCell(cell);
    }

    if (event.key === "Tab") {
      event.preventDefault();
      insertAtCursor(textarea, "  ");
    }
  });

  runButton.addEventListener("click", () => runCell(cell));
  restoreButton.addEventListener("click", () => restoreCell(cell));
}

restartButton.addEventListener("click", () => {
  const confirmed = window.confirm("入力したコードと実行結果を消して、最初からやり直すか。\n（このページ以外には影響しない）");
  if (confirmed) window.location.reload();
});

initializeWebR();

async function initializeWebR() {
  if (window.location.protocol === "file:") {
    setRuntimeError(
      "このファイルは直接開けない",
      "授業用のウェブアドレスから開く。作成者はREADMEの方法でローカルサーバーを起動する"
    );
    return;
  }

  try {
    setRuntimeLoading("R本体をダウンロード中", "初回は30秒から1分ほどかかる");
    const { WebR } = await import(WEBR_MODULE_URL);
    webR = new WebR({ baseUrl: WEBR_BASE_URL });

    setRuntimeLoading("Rを起動中", "このページを閉じずに待つ");
    await webR.init();
    await webR.evalRVoid('options(width = 78, digits = 4, warn = 1)');

    runtimeReady = true;
    setButtonsDisabled(false);
    setRuntimeReady();
  } catch (error) {
    console.error(error);
    setRuntimeError(
      "Rを起動できなかった",
      "通信を確認してページを再読み込みする。改善しなければChromeまたはFirefoxで開く"
    );
  }
}

async function runCell(cell) {
  if (!runtimeReady || runtimeBusy) return;

  const textarea = cell.querySelector("textarea");
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const button = cell.querySelector(".run-button");
  const code = textarea.value.trim();
  const setupCode = cell.querySelector(".r-setup")?.textContent.trim() ?? "";

  if (!code) {
    showCellError(cell, "コードが空欄になっている。「コードを元に戻す」を押す。");
    return;
  }

  runtimeBusy = true;
  setButtonsDisabled(true);
  cell.classList.remove("has-error");
  cell.classList.add("is-running");
  button.textContent = "実行中…";
  outputBox.hidden = false;
  textOutput.classList.remove("is-error");
  textOutput.textContent = "Rが計算している…";
  plotOutput.replaceChildren();
  setRuntimeLoading("コードを実行中", `演習 ${cell.dataset.cellId} を計算している`);

  let shelter = null;
  try {
    shelter = await new webR.Shelter();
    const executableCode = setupCode ? `${setupCode}\n${code}` : code;
    const capture = await shelter.captureR(executableCode, {
      withAutoprint: true,
      captureStreams: true,
      captureConditions: true,
      captureGraphics: {
        width: 760,
        height: 480,
        pointsize: 13,
        bg: "white",
        capture: true
      }
    });

    const lines = capture.output
      .map((entry) => formatOutputEntry(entry))
      .filter(Boolean);

    textOutput.textContent = lines.join("\n");
    textOutput.classList.toggle(
      "is-error",
      capture.output.some((entry) => entry.type === "stderr" || entry.type === "warning")
    );

    for (const image of capture.images) {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `演習${cell.dataset.cellId}でRが作成したグラフ`);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);
      plotOutput.append(canvas);
    }

    if (lines.length === 0 && capture.images.length === 0) {
      textOutput.textContent = cell.dataset.emptyOutput || "（表示される結果はない）";
    }

    cell.classList.add("is-complete");
    completedCells.add(cell.dataset.cellId);
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
    button.textContent = "実行";
    setButtonsDisabled(false);
    setRuntimeReady();
  }
}

function restoreCell(cell) {
  const textarea = cell.querySelector("textarea");
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");

  textarea.value = textarea.dataset.initialCode;
  resizeTextarea(textarea);
  outputBox.hidden = true;
  textOutput.textContent = "";
  textOutput.classList.remove("is-error");
  plotOutput.replaceChildren();
  cell.classList.remove("has-error");
  cell.classList.remove("is-complete");
  completedCells.delete(cell.dataset.cellId);
  updateProgress();
  textarea.focus();
}

function showCellError(cell, message) {
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");

  cell.classList.add("has-error");
  outputBox.hidden = false;
  textOutput.classList.add("is-error");
  textOutput.textContent = `エラー\n${message}`;
  plotOutput.replaceChildren();
}

function friendlyError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw
    .replace(/^Error:\s*/i, "")
    .replace(/^WebAssembly error:\s*/i, "")
    .trim();

  return `${cleaned}\n\n名前のつづり、半角の括弧、カンマを確認する。直らなければ「コードを元に戻す」を押す。`;
}

function formatOutputEntry(entry) {
  if (!entry) return "";
  const prefix = entry.type === "warning" ? "警告: " : "";
  const data = entry.data;

  if (typeof data === "string") return `${prefix}${data}`;
  if (data && typeof data.message === "string") return `${prefix}${data.message}`;

  try {
    return `${prefix}${JSON.stringify(data)}`;
  } catch {
    return `${prefix}${String(data)}`;
  }
}

function setButtonsDisabled(disabled) {
  for (const button of runButtons) button.disabled = disabled;
}

function updateProgress() {
  const completed = completedCells.size;
  const total = cells.length;
  completedCount.textContent = String(completed);
  progressFill.style.width = `${(completed / total) * 100}%`;
}

function setRuntimeLoading(title, detail) {
  statusDot.className = "status-dot status-dot--loading";
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
}

function setRuntimeReady() {
  statusDot.className = "status-dot status-dot--ready";
  statusTitle.textContent = "Rの準備完了";
  statusDetail.textContent = "青い実行ボタンを押せる";
}

function setRuntimeError(title, detail) {
  runtimeReady = false;
  setButtonsDisabled(true);
  statusDot.className = "status-dot status-dot--error";
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
}

function resizeTextarea(textarea) {
  const isSingleLine = textarea.closest(".r-cell")?.classList.contains("r-cell--single");
  const minimumHeight = isSingleLine ? 74 : 120;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight + 2, minimumHeight), 720)}px`;
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.setRangeText(text, start, end, "end");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
