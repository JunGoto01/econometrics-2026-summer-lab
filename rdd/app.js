const WEBR_VERSION = "v0.6.0";
const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;
const CHECK_MARKER = "__RDD_EXERCISE_CHECK__";
const STORAGE_KEY = "econometrics-rdd-browser-lab-v2";
const SECTION_CELLS = {
  "yelp": [
    "Y01",
    "Y02",
    "Y03",
    "Y04",
    "Y05",
    "Y06",
    "Y07",
    "Y08"
  ],
  "college": [
    "C01",
    "C02",
    "C03",
    "C04",
    "C05"
  ],
  "politics": [
    "P01",
    "P02",
    "P03",
    "P04",
    "P05"
  ]
};
const CORE_CELLS = {
  "yelp": [
    "Y01",
    "Y02",
    "Y03",
    "Y04",
    "Y05",
    "Y06"
  ],
  "college": [
    "C01",
    "C02",
    "C03",
    "C04"
  ],
  "politics": [
    "P01",
    "P02",
    "P03",
    "P04"
  ]
};
const SECTION_LABELS = {
  "yelp": "LEVEL 1",
  "college": "LEVEL 2",
  "politics": "LEVEL 3"
};
const CELL_GUIDANCE = {
  "Y01": "1600行・5列。最後の表は全範囲の二群平均で、境界での効果ではない。",
  "Y02": "境界の左右の線を、同じx=3.75で読む。点は店舗そのものではなく区間平均。",
  "Y03": "同じ±0.15・一様な重みではlmとrd_sameが約4.240で一致する。star4は境界での差、star4:xは左右の傾きの差。",
  "Y04": "RD Effect行のPoint Estimateと、右側のRobust Inferenceの95%区間を見る。続くbias_correctedが区間の中心。object内のciの3行目は画面の3行目ではない。",
  "Y05": "h=0.08→0.12→0.18で通常の点推定は約5.09→4.87→4.35。点推定の偏りと区間の幅を別々に読む。",
  "Y06": "Robustの区間が0を含むかに加え、どれほどの差まで区間に含まれるか読む。",
  "Y07": "上段のRobustのP>|T|を見る。下段のBinomial testsは複数の範囲で左右の数を比べる補助検定。",
  "Y08": "偽のカットオフでの点推定と区間を読む。帰無仮説が真でも標本変動で0ぴったりにはならない。",
  "C01": "全範囲の入学率差は約0.758、境界でのfirst stageは約0.578。得点に伴う滑らかな上昇と、境界のジャンプを区別する。",
  "C02": "二つの図を、賃金指数ポイントと試験得点という別々の単位で読む。",
  "C03": "賃金のジャンプと試験成績のジャンプ、それぞれのRobust区間を確認する。",
  "C04": "入学前の成績の点推定とRobust区間を読む。",
  "C05": "first stageは境界での入学率のジャンプ。全体の賃金差を、資格によって入学が変わる割合で割って入学の効果を読む。",
  "P01": "1800行、wonの0/1と勝敗別の数を確認する。境界0なのでmarginがそのまま境界からの距離。",
  "P02": "横軸0で左右の線に隔たりがあるかを見る。",
  "P03": "点推定の単位は契約指数ポイント。Robust区間と、境界付近での効果という対象を合わせて読む。",
  "P04": "推定約3.0、区間約[-1.9,8.0]。差ゼロと両立するが、主効果と比べても大きい約8の事前差を排除できない。",
  "P05": "符号だけでなく、幅を変えたときの推定値と不確実性の変化を読む。"
};
const CELL_PREDICTIONS = {
  "Y01": "1行は独立した個人経営の飲食店。平均評価3.75を境に表示の星が変わる。",
  "Y02": "横軸は表示された星ではなく、丸める前の平均評価。左右の当てはめ線は境界をまたがせず、それぞれ境界から0.15以内の店に当てる。",
  "Y03": "境界から±0.15だけ残す。左右で傾きを変え、境界での高さの差を計算する。",
  "Y04": "点推定、ロバストな95%信頼区間、左右のバンド幅と使用数を確認する。",
  "Y05": "事前に定めたバンド幅0.08、0.12、0.18で推定値と信頼区間を比較する。",
  "Y06": "同じ推定を、評価表示より前の売上指数に適用する。",
  "Y07": "ヒストグラムと密度の不連続検定を組み合わせる。",
  "Y08": "3.60を偽の境界にする。本当の3.75をまたぐと別の効果が混ざるので、星3.5側だけを使う。",
  "C01": "__を埋めて合格資格と実際の入学を区別する。基準点は80点。",
  "C02": "二つの結果について、rdplot()のyを入れ替える。結果をwage_plot・exam_plotへ保存する。",
  "C03": "yとcを埋めてモデルを保存する。最初は実際の入学ではなく、合格資格の効果を求める。",
  "C04": "prior_scoreを結果にする。卒業時成績は処置後の結果なので、事前属性の代わりにはならない。",
  "C05": "fuzzyに実際の入学indicatorを指定する。対象は、境界の資格変化によって入学する人。",
  "P01": "1行は一つの選挙で、事前に一人の候補へ献金した一社。marginは献金先候補と対立候補の得票率差（ポイント）。wonを作り、行数・欠損・勝敗別の数を表示する。境界は0なのでmarginがそのまま境界からの距離になる。",
  "P02": "contracts_afterを縦軸、marginを横軸、c=0、p=1でrdplot()を実行し、contract_plotへ保存する。軸名とタイトルも付ける。ビン数は自動選択のままでも、nbinsで指定してもよい。",
  "P03": "rdrobust()で選挙後の契約指数への効果を推定し、contract_rdに保存してsummary()を表示する。局所線形、境界0とする。",
  "P04": "contracts_beforeを結果変数にして、before_rdへ保存しsummary()を表示する。",
  "P05": "得票率差±3、±5、±8ポイントで推定し、h・estimate・lower・upperの4列を持つ表contract_sensitivityを作る。b=1.5*hとし、Y05のfor文を参照。"
};
const EXERCISE_HINTS = {
  "C01": [
    "合格資格の境界は80点。入学率の結果変数はenrolled。",
    "空欄は順に80、enrolled、80。"
  ],
  "C02": [
    "変数辞書で賃金指数と卒業時試験の列名を確認する。",
    "一つ目はwage_index、二つ目はexit_score。"
  ],
  "C03": [
    "Y04と同じ推定で、結果だけを二種類にする。",
    "yはwage_indexとexit_score、cは両方80。"
  ],
  "C04": [
    "処置より前に決まっている結果を選ぶ。",
    "空欄はprior_score。"
  ],
  "C05": [
    "fuzzyは合格資格eligibleではなく、実際の入学。",
    "空欄はenrolled。"
  ],
  "P01": [
    "Y01を参照し、3.75を0、rating_rawをmarginへ置き換える。",
    "won <- as.integer(margin >= 0)をpoliticsの列として保存する。"
  ],
  "P02": [
    "結果変数contracts_afterと割当変数marginを区別する。c=0、p=1で、ビン数は自動でもよい。",
    "contract_plot <- rdrobust::rdplot(y = politics$contracts_after, x = politics$margin, c = 0, p = 1) が基本形。軸名とタイトルを追加する。"
  ],
  "P03": [
    "Y04と同じ指定で、データとy・x・cを変更する。",
    "y=politics$contracts_after、x=politics$margin、c=0、p=1。"
  ],
  "P04": [
    "選挙前の変数はcontracts_before。",
    "P03のcontracts_afterをcontracts_before、保存先をbefore_rdに変更する。"
  ],
  "P05": [
    "Y05のfor文を参考にする。空の表に一つずつ結果の行を追加する。",
    "widths <- c(3,5,8)、contract_sensitivity <- data.frame()で準備し、for (h in widths) の中で推定・data.frame・rbindを行う。"
  ]
};
const DATA_FILES = [
  "yelp.csv",
  "college.csv",
  "politics.csv"
];
const DATA_SETUP = {
  "yelp": "yelp <- read.csv(\"/home/web_user/yelp.csv\", stringsAsFactors = FALSE)",
  "college": "college <- read.csv(\"/home/web_user/college.csv\", stringsAsFactors = FALSE)",
  "politics": "politics <- read.csv(\"/home/web_user/politics.csv\", stringsAsFactors = FALSE)"
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
let runtimeBusy = false;
let currentVisibleCellId = null;
const completedCells = new Set();
let learningState = loadLearningState();
let courseMode = learningState.courseMode;
const courseModeSelect = document.getElementById("course-mode");
courseModeSelect.value = courseMode;
courseModeSelect.addEventListener("change", () => {
  courseMode = courseModeSelect.value;
  updateProgress();
});

function activeCells() {
  const ids = new Set(Object.values(CORE_CELLS).flat());
  return courseMode === "all" ? cells : cells.filter(cell => ids.has(cell.dataset.cellId));
}

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
    window.localStorage.removeItem(STORAGE_KEY);
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

    setRuntimeLoading("RDDのパッケージを準備中", "初回は数分かかる場合があります");
    await webR.installPackages(["rdrobust", "rddensity"]);
    await webR.evalRVoid('options(width = 92, digits = 4, warn = 1)');
    setRuntimeLoading("データを準備中", "3つの教育用合成データを読み込んでいます");
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
  let recovery = "上から一行ずつ、object名、半角の括弧、カンマ、y・x・cの指定を確認してください。";
  if (/object .* not found|オブジェクト.*ありません/i.test(cleaned)) {
    recovery = "objectがまだ作られていないか、名前が違います。<- の左側と、そのobjectを使う行の綴りを比べてください。";
  } else if (/unexpected (input|symbol)|unexpected end/i.test(cleaned)) {
    recovery = "構文解析エラーです。括弧の閉じ忘れ、カンマ、演算子、全角記号を確認してください。";
  } else if (/could not find function|関数.*見つかりません/i.test(cleaned)) {
    recovery = "関数名の綴りと()を確認してください。推定にはrdrobust::rdrobust()、図にはrdrobust::rdplot()を使います。";
  } else if (/undefined columns|存在しない列|unknown column/i.test(cleaned)) {
    recovery = "列名がdataにありません。上の対応表かnames(data)の出力と綴りを比べてください。";
  } else if (/need finite ['\"]xlim['\"] values|finite.*xlim/i.test(cleaned)) {
    recovery = "横軸には数値の割当変数を指定します。口コミはrating_raw、大学はscore、政治献金はmarginです。";
  } else if (/['\"]x['\"] and ['\"]y['\"] lengths differ|x.*y.*lengths differ/i.test(cleaned)) {
    recovery = "横軸と縦軸の行数が一致していません。同じ表から割当変数と結果変数を渡してください。subset()を使った場合は両方の列を同じ部分標本から選びます。";
  } else if (/cutoff|bandwidth|not enough|invertible/i.test(cleaned)) {
    recovery = "境界cが割当変数の範囲内にあるか、左右のバンド幅内に十分な異なる値があるかを確認してください。";
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
    nextStepButton.textContent = courseMode === "all" ? "全18セル完了" : "標準14セル完了";
    return;
  }
  const currentCellIncomplete = activeCells().some(cell => cell.dataset.cellId === currentVisibleCellId) && !completedCells.has(currentVisibleCellId);
  nextStepButton.textContent = currentCellIncomplete ? "現在の未完了セルへ" : "次の未完了セルへ";
}

function updateSectionCompletion() {
  for (const item of flowItems) {
    const sectionId = item.dataset.flowItem;
    const requirements = (courseMode === "all" ? SECTION_CELLS : CORE_CELLS)[sectionId];
    const complete = Boolean(
      requirements?.length && requirements.every((cellId) => completedCells.has(cellId))
    );
    item.classList.toggle("is-complete", complete);
  }

  const completionGroups = CORE_CELLS;
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
  statusTitle.textContent = "RとRDDパッケージの準備完了";
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
      courseMode: parsed.courseMode === "all" ? "all" : "standard",
      savedAt: parsed.savedAt || null
    };
  } catch (error) {
    console.warn("保存した学習記録を読み込めませんでした", error);
    return { codes: {}, completed: [], lastCellId: null, savedAt: null, courseMode: "standard" };
  }
}

function saveLearningState() {
  const codes = {};
  for (const cell of cells) {
    const textarea = cell.querySelector("textarea");
    if (textarea.value !== textarea.dataset.initialCode) {
      codes[cell.dataset.cellId] = textarea.value;
    }
  }
  learningState = {
    codes,
    courseMode,
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
      const core = CORE_CELLS[section];
      const optional = ids.filter(id => !core.includes(id));
      const group = core.includes(cellId) ? core : optional;
      return {label: `第12回 ${SECTION_LABELS[section]} ${core.includes(cellId) ? "標準" : "発展"}`, index: group.indexOf(cellId)+1, total: group.length};
    }
  }
  return {label: "第12回", index: 0, total: 0};
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
    : "データはこのセル専用のR環境へ自動で準備されます。";
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
    "依頼文を、結果・割当変数・境界・保存先の役割に分ける。",
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
