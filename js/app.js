const CHOICE_KEYS = ["backed", "notBacked", "noClaim"];

const state = {
  ui: null,
  rounds: [],
  index: 0,
  answers: [],
  phase: "intro", // intro | choose | reveal | results
  selected: null,
  ruledOut: [],
  firstSelected: null,
  firstAttemptCorrect: null,
};

const app = document.getElementById("app");
const headerProgress = document.getElementById("header-progress");

function t(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

async function loadData() {
  const [uiRes, roundsRes] = await Promise.all([
    fetch("data/ui.en.json"),
    fetch("data/rounds.en.json"),
  ]);
  if (!uiRes.ok || !roundsRes.ok) {
    throw new Error("Could not load game data.");
  }
  state.ui = await uiRes.json();
  const roundsData = await roundsRes.json();
  state.rounds = roundsData.rounds;
  document.title = state.ui.meta.title;
}

function setProgressVisible(show) {
  headerProgress.hidden = !show;
  if (show) {
    headerProgress.textContent = t(state.ui.round.progress, {
      current: state.index + 1,
      total: state.rounds.length,
    });
  }
}

function resetRoundVoteState() {
  state.selected = null;
  state.ruledOut = [];
  state.firstSelected = null;
  state.firstAttemptCorrect = null;
}

function renderIntro() {
  setProgressVisible(false);
  const { intro } = state.ui;
  app.innerHTML = `
    <section class="panel" aria-labelledby="intro-heading">
      <p class="draft-banner" role="status">${escapeHtml(intro.draftBanner)}</p>
      <p class="eyebrow">${escapeHtml(intro.eyebrow)}</p>
      <h1 id="intro-heading">${escapeHtml(intro.heading)}</h1>
      <p class="lead">${escapeHtml(intro.lead)}</p>
      <ul class="option-list">
        ${intro.options.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}
      </ul>
      <p class="trap-note">${escapeHtml(intro.trapNote)}</p>
      <div class="intro-actions">
        <button class="btn btn-primary" type="button" data-action="start">${escapeHtml(intro.startLabel)}</button>
      </div>
    </section>
  `;
  app.querySelector('[data-action="start"]').focus();
}

function currentRound() {
  return state.rounds[state.index];
}

function choiceButtonHtml(key, copy) {
  return `
    <button
      class="btn btn-choice"
      type="button"
      data-choice="${key}"
      aria-pressed="false"
    >${escapeHtml(copy.choices[key])}</button>`;
}

function adCardHtml(round, { compact = false, enter = false } = {}) {
  const { a11y } = state.ui;
  const classes = [
    "ad-card",
    compact ? "ad-card-compact" : "",
    enter ? "ad-card-enter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headline = round.headline
    ? `<${compact ? "p" : "h2"} class="ad-headline">${escapeHtml(round.headline)}</${compact ? "p" : "h2"}>`
    : "";
  const body =
    !compact && round.body
      ? `<p class="ad-body">${escapeHtml(round.body)}</p>`
      : "";

  return `
    <article class="${classes}" aria-label="${escapeHtml(a11y.adCardLabel)}">
      <div class="ad-visual">
        <p class="ad-format">${escapeHtml(round.format)} · ${escapeHtml(round.brand)}</p>
        ${headline}
        ${body}
        <p class="ad-visual-desc">${escapeHtml(round.visual)}</p>
      </div>
      <div class="ad-footer">
        <span>${escapeHtml(round.tagline)}</span>
        <span aria-hidden="true">${escapeHtml(round.brand)}</span>
      </div>
    </article>`;
}

function renderRound() {
  const round = currentRound();
  const { round: copy, a11y } = state.ui;
  setProgressVisible(true);
  state.phase = "choose";

  app.innerHTML = `
    <section class="panel" aria-labelledby="round-prompt">
      ${adCardHtml(round, { enter: true })}

      <p class="prompt" id="round-prompt" role="status">${escapeHtml(copy.prompt)}</p>
      <div class="choices" role="group" aria-label="${escapeHtml(a11y.choiceGroupLabel)}">
        ${CHOICE_KEYS.map((key) => choiceButtonHtml(key, copy)).join("")}
      </div>
      <p class="sr-only" id="wrong-alert" role="alert" aria-live="assertive"></p>
    </section>
  `;

  const card = app.querySelector(".ad-card-enter");
  card?.addEventListener(
    "animationend",
    () => card.classList.remove("ad-card-enter"),
    { once: true }
  );

  app.querySelector(".btn-choice")?.focus();
}

function markChoiceWrong(choice) {
  const { round: copy, a11y } = state.ui;
  const button = app.querySelector(`[data-choice="${choice}"]`);
  if (!button || button.disabled) return;

  button.classList.add("is-wrong");
  button.setAttribute("aria-pressed", "true");
  button.disabled = true;

  const prompt = document.getElementById("round-prompt");
  if (prompt) {
    prompt.textContent = copy.tryAgain;
    prompt.classList.add("is-retry");
  }

  const alert = document.getElementById("wrong-alert");
  if (alert) {
    alert.textContent = "";
    // Force a change so screen readers re-announce on repeat misses.
    requestAnimationFrame(() => {
      alert.textContent = a11y.wrongChoice;
    });
  }

  const nextFocus = app.querySelector(".btn-choice:not(:disabled)");
  nextFocus?.focus();
}

function renderReveal() {
  const round = currentRound();
  const { reveal, answers, techniques } = state.ui;
  state.phase = "reveal";
  setProgressVisible(true);

  const isLast = state.index >= state.rounds.length - 1;
  const continueLabel = isLast ? reveal.finish : reveal.continue;

  app.innerHTML = `
    <section class="panel reveal" aria-labelledby="reveal-status">
      <div class="reveal-top">
        <div class="reveal-copy">
          <p class="reveal-status is-correct" id="reveal-status" role="status">
            ${escapeHtml(reveal.correct)}
          </p>
          <p class="answer-compare">
            <strong>${escapeHtml(reveal.classAnswer)}:</strong> ${escapeHtml(answers[state.selected])}
          </p>
        </div>
        <div class="reveal-ad-ref">
          ${adCardHtml(round, { compact: true })}
        </div>
      </div>
      <dl class="reveal-grid">
        <div class="reveal-item reveal-item-wide">
          <dt>${escapeHtml(reveal.feeling)}</dt>
          <dd>${escapeHtml(round.feeling)}</dd>
        </div>
        <div class="reveal-item">
          <dt>${escapeHtml(reveal.literalClaim)}</dt>
          <dd>${escapeHtml(round.literalClaim)}</dd>
        </div>
        <div class="reveal-item">
          <dt>${escapeHtml(reveal.evidence)}</dt>
          <dd>${escapeHtml(round.evidence)}</dd>
        </div>
        <div class="reveal-item">
          <dt>${escapeHtml(reveal.technique)}</dt>
          <dd>${escapeHtml(techniques[round.technique] || round.technique)}</dd>
        </div>
        <div class="reveal-item">
          <dt>${escapeHtml(reveal.verify)}</dt>
          <dd>${escapeHtml(round.verify)}</dd>
        </div>
      </dl>
      <div class="reveal-actions">
        <button class="btn btn-primary" type="button" data-action="continue">${escapeHtml(continueLabel)}</button>
      </div>
    </section>
  `;

  app.querySelector('[data-action="continue"]').focus();
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function renderResults() {
  const { results, answers } = state.ui;
  const correct = state.answers.filter((a) => a.correct).length;
  setProgressVisible(false);
  state.phase = "results";
  scrollToTop();

  app.innerHTML = `
    <section class="panel" aria-labelledby="results-heading">
      <h1 id="results-heading">${escapeHtml(results.heading)}</h1>
      <p class="score-line">${escapeHtml(
        t(results.score, { correct, total: state.rounds.length })
      )}</p>
      <p class="lead">${escapeHtml(results.softSellNote)}</p>
      <h2>${escapeHtml(results.breakdownHeading)}</h2>
      <ol class="breakdown">
        ${state.answers
          .map((entry, i) => {
            const round = state.rounds[i];
            const badge = entry.correct ? results.match : results.miss;
            const badgeClass = entry.correct ? "badge-match" : "badge-miss";
            return `
              <li>
                <span class="badge ${badgeClass}">${escapeHtml(badge)}</span>
                <span><strong>${escapeHtml(round.brand)}</strong>, first vote: ${escapeHtml(
                  answers[entry.firstSelected]
                )}</span>
                <span>${escapeHtml(answers[round.answer])}</span>
              </li>`;
          })
          .join("")}
      </ol>
      <button class="btn btn-primary" type="button" data-action="replay">${escapeHtml(results.replay)}</button>
    </section>
  `;

  app.querySelector("#results-heading")?.setAttribute("tabindex", "-1");
  app.querySelector("#results-heading")?.focus({ preventScroll: true });
  scrollToTop();
}

function startGame() {
  state.index = 0;
  state.answers = [];
  resetRoundVoteState();
  renderRound();
}

function selectChoice(choice) {
  if (state.phase !== "choose") return;
  if (state.ruledOut.includes(choice)) return;

  const round = currentRound();
  const isCorrect = choice === round.answer;
  const isFirstAttempt = state.firstSelected == null;

  if (isFirstAttempt) {
    state.firstSelected = choice;
    state.firstAttemptCorrect = isCorrect;
  }

  if (!isCorrect) {
    state.ruledOut = [...state.ruledOut, choice];
    markChoiceWrong(choice);
    return;
  }

  state.selected = choice;
  state.answers.push({
    roundId: round.id,
    firstSelected: state.firstSelected,
    selected: choice,
    correct: state.firstAttemptCorrect,
    attempts: state.ruledOut.length + 1,
  });
  renderReveal();
}

function continueFromReveal() {
  if (state.index >= state.rounds.length - 1) {
    renderResults();
    return;
  }
  state.index += 1;
  resetRoundVoteState();
  renderRound();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-choice]");
  if (!target) return;

  if (target.dataset.action === "start") {
    startGame();
    return;
  }
  if (target.dataset.action === "replay") {
    resetRoundVoteState();
    state.index = 0;
    state.answers = [];
    scrollToTop();
    renderIntro();
    return;
  }
  if (target.dataset.action === "continue") {
    continueFromReveal();
    return;
  }
  if (target.dataset.choice) {
    selectChoice(target.dataset.choice);
  }
});

async function init() {
  try {
    await loadData();
    document.getElementById("loading")?.remove();
    renderIntro();
  } catch (err) {
    app.innerHTML = `<p class="panel" role="alert">Could not start the game. Serve this folder over HTTP (not as a file:// page) so data JSON can load.<br><small>${escapeHtml(
      err.message
    )}</small></p>`;
  }
}

init();
