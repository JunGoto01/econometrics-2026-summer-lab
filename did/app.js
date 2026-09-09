const WEBR_VERSION = "v0.6.0";
const WEBR_BASE_URL = `https://webr.r-wasm.org/${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;
const CHECK_MARKER = "__DID_EXERCISE_CHECK__";
const STORAGE_KEY = "econometrics-did-browser-lab-v2";

const SECTION_CELLS = {
  structure: ["D01", "D02", "D03", "D04", "D05"],
  anime: ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"],
  mtv: ["M01", "M02", "M03", "M04", "M05", "M06"],
  police: ["P01", "P02", "P03", "P04", "P05", "P06", "P07"]
};

const CELL_GUIDANCE = {
  D01: "最初の「660 11」が行数と列数。先頭8行では、同じ自治体M01のyearだけが変わっていることを確認する。",
  D02: "自治体60 × 年11 ＝ 行660になっているか。パネルの行数を単位数と時点数へ分解する。",
  D03: "duplicated_keysが0で、すべての自治体が11行ずつなら、重複のないbalanced panel。",
  D04: "主要変数の欠損が0か、処置群と対照群が何自治体ずつか、処置開始年が2010年かを見る。",
  D05: "各年に処置群と対照群の2行がある。回帰前に、二群の平均が年ごとにどう動くかを読む。",
  A01: "2010年より前の二本の線の傾きを比較する。水準差ではなく、処置前の変化が類似しているかを確認する。",
  A02: "舞台群の変化10から対照群の変化5を引き、did_by_handが5になる場所を見る。",
  A03: "anime_stage:postのEstimateを見る。手計算したDiDと同じ約5になっているかを確認する。",
  A04: "coef()の値が点推定。confint()の2.5 %列と97.5 %列が95%信頼区間の下限と上限であり、0を含むか確認する。",
  A05: "11年を使ったanime_stage:postの係数を見る。2期だけの結果と大きく違わないかを比べる。予想値は約5.0。",
  A06: "相対年−5〜−2が0付近か、その後の係数が正方向へ動くかを見る。−1は比較の基準。",
  A07: "本当は処置されていない偽群の係数が0付近かを見る。大きければ共通ショックを疑う。",
  A08: "再開発を入れる前後でanime_stage:postの係数がどれだけ動くかを比較する。",
  M01: "cutoffが13.235、low_marketsとhigh_marketsが40ずつになっているかを見る。",
  M02: "放送前の出生率・MTV視聴率・失業率を二群で比べる。水準が完全に同じである必要はない。",
  M03: "放送前の二本の線の傾きを比べる。縦線より後に高MTV群が相対的に低下するかを見る。",
  M04: "high_mtv:postまたはpost:high_mtvのEstimateを見る。単位は出生率ポイントで、予想値は約−1.70。",
  M05: "放送前の係数が0付近か、放送後に負方向へ動くかを見る。−1四半期が基準。",
  M06: "本当の放送前に置いたfake_postの係数が0付近かを見る。効果が出れば事前トレンドを疑う。",
  P01: "rows 5400、blocks 300、months 18、duplicated_keys 0の四つを確認する。",
  P02: "施設街区×前後の4行を読む。処置群の減少から対照群の変化を引く準備になる。",
  P03: "配置前は二群の傾きが近く、month_index 8以降に施設街区の線が下へ離れるかを見る。",
  P04: "protected_facility:postのEstimateを見る。単位は1街区・1か月当たりの盗難件数で約−0.96。",
  P05: "配置前の係数が0付近か、配置後に負方向へ動くかを見る。−1か月が基準。",
  P06: "adjacent_block:postが0付近かを見る。負でなければ、隣接街区への明確な移転は確認できない。",
  P07: "偽アウトカムbicycle_theftsの係数が0付近かを確認し、アウトカム固有性を検討する。"
};

const CELL_PREDICTIONS = {
  D01: "行数、列数および一行が表す観測単位を確認する。",
  D02: "60自治体×11年から期待される行数を計算する。",
  D03: "重複keyの件数と、自治体当たりの行数を確認する。",
  D04: "主要変数の欠損数と、処置群・対照群の自治体数を確認する。",
  D05: "2010年以降に相対的な上昇が見込まれる群を確認する。",
  A01: "処置前の平行性と、処置後の二群の乖離を確認する。",
  A02: "舞台群の変化10から対照群の変化5を差し引く。",
  A03: "回帰のDiD係数と手計算の5を比較する。",
  A04: "95%信頼区間が0を含むか確認する。",
  A05: "全11年を使用した係数と5を比較する。",
  A06: "処置前係数は0付近、処置後係数は正と想定する。",
  A07: "偽の処置群の係数は0付近と想定する。",
  A08: "再開発変数の追加前後で主係数を比較する。",
  M01: "中央値で分割した各群の市場数を確認する。",
  M02: "放送前水準の一致はDiDの必要条件ではないことを確認する。",
  M03: "放送後に高MTV群の出生率が相対的に低下するか確認する。",
  M04: "DiD係数の予想符号は負。",
  M05: "放送前係数は0付近、放送後係数は負と想定する。",
  M06: "偽の放送時期の係数は0付近と想定する。",
  P01: "300街区×18か月の行数と重複key数を確認する。",
  P02: "施設街区では配置後の自動車盗減少が相対的に大きいと想定する。",
  P03: "month_index 8以降の施設街区の相対的な低下を確認する。",
  P04: "警官配置の係数の予想符号は負。",
  P05: "配置前係数は0付近、配置後係数は負と想定する。",
  P06: "隣接街区への移転がなければ係数は0付近と想定する。",
  P07: "警官配置が自転車盗に影響しない設定では係数は0付近と想定する。"
};

const EXERCISE_HINTS = {
  M01: ["cutoffの算出に使用する関数と、cutoffより高いことを表す比較演算子を確認する。", "中央値にはmedian()、より大きいことの判定には > を使用する。二つの__を置き換える。"],
  M02: ["最初にpostが0の行だけを残し、その表を群別集計へ渡す。", "subset(mtv, post == 0)の後、aggregate()の左側へ三つの結果変数をcbind()で並べる。"],
  M03: ["aggregate()の式は「結果 ~ 群 + 時間」の順。作図部分は変更しない。", "teen_birth_rate ~ high_mtv + period_index を最初の式へ入れる。"],
  M04: ["SLIDE 19の対応表で、結果・処置群・単位FE・時間FEに該当する列を確認する。", "結果 ~ high_mtv:post | market_id + period、clusterもmarket_idにする。"],
  M05: ["i()には相対時点、処置群、基準時点を渡す。固定効果はM04と同じ。", "i(relative_quarter, high_mtv, ref = -1) | market_id + period の形になる。"],
  M06: ["本当の放送前だけを残し、その中で7期目以降を偽の処置後にする。", "period_index <= 10で限定し、fake_postはperiod_index >= 7。式はM04のpostだけをfake_postへ替える。"],
  P01: ["四つの数字を一度に作る前に、block_idとperiodをつないだkeyを作る。", "police_key <- paste(police$block_id, police$period)から始め、c(rows = nrow(...), blocks = length(unique(...)), months = ..., duplicated_keys = sum(duplicated(...)))を作る。"],
  P02: ["A02のfour_meansと同じaggregate()を使う。結果・群・前後の列名だけを替える。", "police_summary <- aggregate(car_thefts ~ protected_facility + post, data = police, FUN = mean) とし、最後に表示する。"],
  P03: ["まず「結果 ~ 群 + 時間」で36行の平均表を作り、教材用plot_did_trends()へ渡す。", "police_trend <- aggregate(car_thefts ~ protected_facility + month_index, data = police, FUN = mean) が前半。後半はtime、outcome、groupへ同じ三列を文字列で渡す。"],
  P04: ["M04のfeols()と同じ式構造を使用し、五つの役割を警官配置データの列名へ対応させる。", "car_thefts ~ protected_facility:post | block_id + period、data = police、cluster = ~block_id。結果をpolice_modelへ保存する。"],
  P05: ["M05と同じi(相対時点, 処置群, ref = -1)を使う。", "i(relative_month, protected_facility, ref = -1) | block_id + period。結果はpolice_event_modelへ保存しiplot()へ渡す。"],
  P06: ["施設街区を除いてから、隣接街区を処置群とみなすplacebo。", "subset(police, protected_facility == 0)を作り、adjacent_block:post | block_id + periodを推定する。"],
  P07: ["P04から変えるのは結果変数と保存名だけ。", "結果をbicycle_thefts、保存名をoutcome_placeboにする。処置・固定効果・clusterはP04と同じ。"]
};

const DATA_FILES = [
  "anime_panel.csv",
  "mtv_panel.csv",
  "police_panel.csv"
];

const DATA_SETUP = {
  anime: 'anime <- read.csv("/home/web_user/anime_panel.csv", stringsAsFactors = FALSE)',
  mtv: 'mtv <- read.csv("/home/web_user/mtv_panel.csv", stringsAsFactors = FALSE)',
  police: 'police <- read.csv("/home/web_user/police_panel.csv", stringsAsFactors = FALSE)'
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

    setRuntimeLoading("fixestを準備中", "固定効果推定に必要なパッケージを初回だけ読み込みます");
    await webR.installPackages(["fixest"]);
    await webR.evalRVoid(`
      options(width = 92, digits = 4, warn = 1)
      suppressPackageStartupMessages(library(fixest))
      fixest::setFixest_nthreads(1)

      did_coefficient <- function(model, first_term, second_term) {
        candidates <- c(
          paste(first_term, second_term, sep = ":"),
          paste(second_term, first_term, sep = ":")
        )
        matched <- intersect(candidates, names(coef(model)))
        if (length(matched) != 1) return(NA_real_)
        unname(coef(model)[matched])
      }

      has_model_spec <- function(
        model, outcome, unit_fixed_effect, time_fixed_effects, cluster
      ) {
        if (!inherits(model, "fixest")) return(FALSE)

        fixed_effects <- model$fixef_vars
        fixed_effects_ok <-
          length(fixed_effects) == 2 &&
          unit_fixed_effect %in% fixed_effects &&
          any(time_fixed_effects %in% fixed_effects) &&
          all(fixed_effects %in% c(unit_fixed_effect, time_fixed_effects))

        cluster_call <- model$call$cluster
        if (is.null(cluster_call)) cluster_call <- model$call$vcov
        cluster_variables <- if (
          inherits(cluster_call, "formula") || is.language(cluster_call)
        ) {
          all.vars(cluster_call)
        } else if (is.character(cluster_call)) {
          cluster_call
        } else if (is.name(cluster_call)) {
          as.character(cluster_call)
        } else {
          character()
        }

        identical(all.vars(model$fml)[1], outcome) &&
          fixed_effects_ok &&
          identical(cluster_variables, cluster)
      }

      valid_police_summary <- function(summary_object, data) {
        expected_matrix <- with(
          data,
          tapply(car_thefts, list(protected_facility, post), mean)
        )
        if (is.matrix(summary_object) || is.array(summary_object)) {
          return(
            identical(dim(summary_object), c(2L, 2L)) &&
              isTRUE(all.equal(
                as.numeric(summary_object),
                as.numeric(expected_matrix),
                tolerance = 1e-8
              ))
          )
        }
        if (!is.data.frame(summary_object) || nrow(summary_object) != 4) {
          return(FALSE)
        }

        binary_columns <- names(summary_object)[vapply(
          summary_object,
          function(x) is.numeric(x) && setequal(unique(x), c(0, 1)),
          logical(1)
        )]
        value_columns <- names(summary_object)[vapply(
          summary_object,
          is.numeric,
          logical(1)
        )]
        for (group_column in binary_columns) {
          for (post_column in setdiff(binary_columns, group_column)) {
            expected_values <- expected_matrix[cbind(
              summary_object[[group_column]] + 1L,
              summary_object[[post_column]] + 1L
            )]
            for (value_column in setdiff(
              value_columns,
              c(group_column, post_column)
            )) {
              if (isTRUE(all.equal(
                summary_object[[value_column]],
                as.numeric(expected_values),
                tolerance = 1e-8
              ))) return(TRUE)
            }
          }
        }
        FALSE
      }

      plot_did_trends <- function(
        data, time, outcome, group, intervention,
        group_labels = c("Comparison", "Treated"),
        event_label = "Treatment", main = "",
        xlab = time, ylab = outcome
      ) {
        comparison <- data[data[[group]] == 0, , drop = FALSE]
        treated <- data[data[[group]] == 1, , drop = FALSE]
        plot(
          comparison[[time]], comparison[[outcome]],
          type = "o", pch = 16, col = "#2A6F97",
          ylim = range(data[[outcome]], na.rm = TRUE),
          xlab = xlab, ylab = ylab, main = main
        )
        lines(treated[[time]], treated[[outcome]],
          type = "o", pch = 17, col = "#EE6C4D")
        abline(v = intervention, lty = 2, col = "#64748B")
        legend(
          "topleft", c(group_labels, event_label),
          col = c("#2A6F97", "#EE6C4D", "#64748B"),
          lty = c(1, 1, 2), pch = c(16, 17, NA), bty = "n"
        )
      }
    `);

    setRuntimeLoading("データを準備中", "3つの合成パネルデータをブラウザ内のRへ渡しています");
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
      await shelter.captureR(prerequisiteCode, {
        env: cellEnvironment,
        withAutoprint: false,
        captureStreams: true,
        captureConditions: true,
        captureGraphics: false
      });
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
      || capture.images.length > 0;
    const exercisePassed = checkPassed && requiredPlotCreated;

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
  let recovery = "上から一行ずつ、object名、半角の括弧、カンマ、+、|を確認してください。";
  if (/object .* not found|オブジェクト.*ありません/i.test(cleaned)) {
    recovery = "objectがまだ作られていないか、名前が違います。<- の左側と、そのobjectを使う行の綴りを比べてください。";
  } else if (/unexpected (input|symbol)|unexpected end/i.test(cleaned)) {
    recovery = "構文解析エラーです。括弧の閉じ忘れ、カンマ、演算子、全角記号を確認してください。";
  } else if (/could not find function|関数.*見つかりません/i.test(cleaned)) {
    recovery = "関数名の綴りと()を確認してください。fixestの関数はfixest::feols()の形でも書けます。";
  } else if (/undefined columns|存在しない列|unknown column/i.test(cleaned)) {
    recovery = "列名がdataにありません。上の対応表かnames(data)の出力と綴りを比べてください。";
  } else if (/need finite ['\"]xlim['\"] values|finite.*xlim/i.test(cleaned)) {
    recovery = "横軸には数値の時間変数を指定します。MTV事例ではperiod_index、警官配置事例ではmonth_indexを使用し、periodは使用しません。";
  } else if (/['\"]x['\"] and ['\"]y['\"] lengths differ|x.*y.*lengths differ/i.test(cleaned)) {
    recovery = "横軸と縦軸の行数が一致していません。aggregate()で作成した平均表をplot_did_trends()へ渡し、time、outcome、groupがその表の列名か確認してください。時間変数はMTV事例ではperiod_index、警官配置事例ではmonth_indexです。";
  } else if (/factor_var|ref.*not found|reference.*not found|value.*ref.*variable/i.test(cleaned)) {
    recovery = "i()の引数順を確認してください。第1引数は相対時点、第2引数は処置群、ref = -1は基準時点です。";
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
  const completed = completedCells.size;
  const total = cells.length;
  completedCount.textContent = String(completed);
  progressFill.style.width = `${(completed / total) * 100}%`;
  progressTrack?.setAttribute("aria-valuenow", String(completed));
  updateSectionCompletion();
  nextStepButton.disabled = completed === total;
  updateNextStepButtonLabel();
  if (save) saveLearningState();
}

function updateNextStepButtonLabel() {
  if (completedCells.size === cells.length) {
    nextStepButton.textContent = "全セル完了";
    return;
  }
  const currentCellIncomplete = currentVisibleCellId && !completedCells.has(currentVisibleCellId);
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

  const completionGroups = {
    lecture9: [...SECTION_CELLS.structure, ...SECTION_CELLS.anime],
    mtv: SECTION_CELLS.mtv,
    police: SECTION_CELLS.police
  };
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
  statusTitle.textContent = "Rとfixestの準備完了";
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
  const currentIndex = cells.findIndex((cell) => cell.dataset.cellId === currentVisibleCellId);
  const currentCell = currentIndex >= 0 ? cells[currentIndex] : null;
  if (currentCell && !completedCells.has(currentCell.dataset.cellId)) {
    scrollToCell(currentCell);
    return;
  }
  const cellsAfterCurrent = currentIndex >= 0 ? cells.slice(currentIndex + 1) : cells;
  const target = cellsAfterCurrent.find((cell) => !completedCells.has(cell.dataset.cellId))
    || cells.find((cell) => !completedCells.has(cell.dataset.cellId));
  if (target) {
    scrollToCell(target);
  } else {
    document.getElementById("summary")?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
  }
}

function scrollToPreviousCell() {
  const currentIndex = cells.findIndex((cell) => cell.dataset.cellId === currentVisibleCellId);
  const target = cells[Math.max(0, currentIndex - 1)] || cells[0];
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
  const lecture9Cells = [...SECTION_CELLS.structure, ...SECTION_CELLS.anime];
  if (lecture9Cells.includes(cellId)) {
    return { label: "第9回", index: lecture9Cells.indexOf(cellId) + 1, total: lecture9Cells.length };
  }
  if (SECTION_CELLS.mtv.includes(cellId)) {
    return { label: "第10回 LEVEL 2", index: SECTION_CELLS.mtv.indexOf(cellId) + 1, total: SECTION_CELLS.mtv.length };
  }
  return { label: "第10回 LEVEL 3", index: SECTION_CELLS.police.indexOf(cellId) + 1, total: SECTION_CELLS.police.length };
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
  routine.append(meta, steps, prediction, dependency, state);
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
    "依頼文を、結果・群・時間・固定効果・clusterの役割に分ける。",
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
