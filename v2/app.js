const WEBR_VERSION = "v0.6.0";
const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;
const CHECK_MARKER = "__LECTURE4_EXERCISE_CHECK__";

const cells = [...document.querySelectorAll(".r-cell")];
const runButtons = [...document.querySelectorAll(".run-button")];
const statusDot = document.getElementById("status-dot");
const statusTitle = document.getElementById("status-title");
const statusDetail = document.getElementById("status-detail");
const completedCount = document.getElementById("completed-count");
const totalCount = document.getElementById("total-count");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");
const restartButton = document.getElementById("restart-button");
const canonicalDataSetup = document
  .getElementById("canonical-data-setup")
  ?.textContent.trim() ?? "";
const flowSections = [...document.querySelectorAll("[data-flow-section]")];
const flowItems = [...document.querySelectorAll("[data-flow-item]")];
const flowList = document.getElementById("flow-list");
const flowMobileCurrent = document.getElementById("flow-mobile-current");

let webR = null;
let runtimeReady = false;
let runtimeBusy = false;
const completedCells = new Set();

totalCount.textContent = String(cells.length);
progressTrack?.setAttribute("aria-valuemax", String(cells.length));

for (const cell of cells) {
  const textarea = cell.querySelector("textarea");
  const runButton = cell.querySelector(".run-button");
  const restoreButton = cell.querySelector(".restore-button");

  textarea.dataset.initialCode = textarea.value;
  runButton.dataset.idleLabel = runButton.textContent;
  textarea.wrap = "off";
  resizeTextarea(textarea);

  textarea.addEventListener("input", () => resizeTextarea(textarea));
  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (runtimeReady && !runtimeBusy) runCell(cell);
    }
  });

  runButton.addEventListener("click", () => runCell(cell));
  restoreButton.addEventListener("click", () => restoreCell(cell));
}

restartButton.addEventListener("click", () => {
  const confirmed = window.confirm("入力したコード、実行結果、Rが覚えた値や関数を消して、最初からやり直すか。\n（このページ以外には影響しない）");
  if (confirmed) window.location.reload();
});

initializeFlowRail();
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
  const checkOutput = cell.querySelector(".check-output");
  const button = cell.querySelector(".run-button");
  const code = textarea.value.trim();
  const dataSetupCode = cell.hasAttribute("data-use-data")
    ? canonicalDataSetup
    : "";
  const setupCode = cell.querySelector(".r-setup")?.textContent.trim() ?? "";
  const checkCode = cell.querySelector(".r-check")?.textContent.trim() ?? "";

  if (!code) {
    showCellError(cell, "コードが空欄になっている。「コードを元に戻す」を押す。");
    return;
  }

  runtimeBusy = true;
  setButtonsDisabled(true);
  cell.classList.remove("has-error");
  cell.classList.remove("needs-revision");
  cell.classList.add("is-running");
  button.textContent = "実行中…";
  outputBox.hidden = false;
  textOutput.classList.remove("is-error");
  textOutput.textContent = "Rが計算している…";
  plotOutput.replaceChildren();
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
  setRuntimeLoading("コードを実行中", `演習 ${cell.dataset.cellId} を計算している`);

  let shelter = null;
  try {
    shelter = await new webR.Shelter();
    const checkCommand = checkCode
      ? `cat("\\n${CHECK_MARKER}:", if (isTRUE({${checkCode}})) "PASS" else "FAIL", "\\n")`
      : "";
    const executableCode = [dataSetupCode, setupCode, code, checkCommand]
      .filter(Boolean)
      .join("\n");
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
    const joinedOutput = lines.join("\n");
    const checkMatch = joinedOutput.match(
      new RegExp(`${CHECK_MARKER}:\\s*(PASS|FAIL)`)
    );
    const visibleOutput = joinedOutput
      .replace(new RegExp(`\\n?${CHECK_MARKER}:\\s*(?:PASS|FAIL)\\n?`, "g"), "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const exercisePassed = !checkCode || checkMatch?.[1] === "PASS";

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
      canvas.setAttribute("aria-label", `演習${cell.dataset.cellId}でRが作成したグラフ`);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);
      plotOutput.append(canvas);
    }

    if (!visibleOutput && capture.images.length === 0) {
      textOutput.textContent = cell.dataset.emptyOutput || "（表示される結果はない）";
    }

    if (checkCode) {
      renderCheckResult(cell, exercisePassed);
    }

    if (exercisePassed) {
      cell.classList.add("is-complete");
      cell.classList.remove("needs-revision");
      completedCells.add(cell.dataset.cellId);
    } else {
      cell.classList.remove("is-complete");
      cell.classList.add("needs-revision");
      completedCells.delete(cell.dataset.cellId);
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

function restoreCell(cell) {
  const textarea = cell.querySelector("textarea");
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");

  textarea.value = textarea.dataset.initialCode;
  resizeTextarea(textarea);
  outputBox.hidden = true;
  textOutput.textContent = "";
  textOutput.classList.remove("is-error");
  plotOutput.replaceChildren();
  cell.classList.remove("has-error");
  cell.classList.remove("needs-revision");
  cell.classList.remove("is-complete");
  if (checkOutput) {
    checkOutput.hidden = true;
    checkOutput.textContent = "";
  }
  completedCells.delete(cell.dataset.cellId);
  updateProgress();
  textarea.focus();
}

function showCellError(cell, message) {
  const outputBox = cell.querySelector(".r-output");
  const textOutput = cell.querySelector(".text-output");
  const plotOutput = cell.querySelector(".plot-output");
  const checkOutput = cell.querySelector(".check-output");

  cell.classList.add("has-error");
  cell.classList.remove("is-complete");
  cell.classList.remove("needs-revision");
  completedCells.delete(cell.dataset.cellId);
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
    ? cell.dataset.checkSuccess || "正解。"
    : cell.dataset.checkFailure || "まだ正解ではない。依頼と作った値を確認する。";

  checkOutput.hidden = false;
  checkOutput.className = `check-output check-output--${passed ? "pass" : "retry"}`;
  checkOutput.textContent = `${passed ? "課題の判定　正解" : "課題の判定　もう一度"}\n${message}`;
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
  progressTrack?.setAttribute("aria-valuenow", String(completed));
}

function initializeFlowRail() {
  if (flowSections.length === 0 || flowItems.length === 0) return;

  let updateQueued = false;
  const scheduleFlowUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(() => {
      updateQueued = false;
      updateCurrentFlow();
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(scheduleFlowUpdate, {
      rootMargin: "-22% 0px -66% 0px",
      threshold: [0, 0.01, 1]
    });

    for (const section of flowSections) observer.observe(section);
  }

  window.addEventListener("scroll", scheduleFlowUpdate, { passive: true });
  window.addEventListener("resize", scheduleFlowUpdate, { passive: true });
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

  const documentBottom = document.documentElement.scrollHeight - 4;
  if (window.scrollY + window.innerHeight >= documentBottom) {
    currentSection = flowSections.at(-1);
  }

  setCurrentFlow(currentSection.dataset.flowSection);
}

function setCurrentFlow(flowId) {
  const currentIndex = flowItems.findIndex(
    (item) => item.dataset.flowItem === flowId
  );

  if (currentIndex < 0) return;

  for (const [index, item] of flowItems.entries()) {
    const link = item.querySelector("a");
    const isCurrent = index === currentIndex;
    item.classList.toggle("is-current", isCurrent);
    item.classList.toggle("is-past", index < currentIndex);

    if (isCurrent) {
      link?.setAttribute("aria-current", "step");
    } else {
      link?.removeAttribute("aria-current");
    }
  }

  const currentItem = flowItems[currentIndex];
  const currentLabel = currentItem.querySelector(".flow-rail__text")?.textContent;
  if (flowMobileCurrent && currentLabel) {
    flowMobileCurrent.textContent = currentLabel;
  }

  if (window.innerWidth <= 1180 && flowList) {
    const left = Math.max(
      0,
      currentItem.offsetLeft - (flowList.clientWidth - currentItem.offsetWidth) / 2
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    flowList.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
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
  const isLongSource = textarea.closest(".r-cell")?.classList.contains("r-cell--long");
  const minimumHeight = isSingleLine ? 74 : 120;
  const maximumHeight = isLongSource ? 1800 : 720;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(
    Math.max(textarea.scrollHeight + 2, minimumHeight),
    maximumHeight
  )}px`;
}
