import { confederationOrder, teams } from "./data/teams.js";
import { getQuestionsForTeam } from "./data/trivia.js";

const STORAGE_KEY = "world-cup-quest-progress-v1";

const elements = {
  dashboard: document.querySelector("#dashboard"),
  quizPanel: document.querySelector("#quiz-panel"),
  summaryCards: document.querySelector("#summary-cards")
};

const state = {
  selectedTeamId: null,
  progress: loadProgress(),
  quiz: null
};

const api = {
  async getTeams() {
    return teams;
  },
  async getQuestions(teamId) {
    const team = teams.find((entry) => entry.id === teamId);
    return getQuestionsForTeam(team, teams);
  }
};

init();

async function init() {
  state.teams = await api.getTeams();
  renderSummary();
  renderDashboard();
  renderQuizPanel();
}

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveProgress() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function getTeamProgress(teamId) {
  return state.progress[teamId] ?? { bestScore: 0, completed: false, lastPlayedAt: null };
}

function renderSummary() {
  const confirmedTeams = state.teams.filter((team) => team.qualificationStatus !== "playoff");
  const completedCount = confirmedTeams.filter((team) => getTeamProgress(team.id).completed).length;
  const bestAggregate = confirmedTeams.reduce(
    (total, team) => total + getTeamProgress(team.id).bestScore,
    0
  );

  const cards = [
    { label: "Confirmed Teams", value: confirmedTeams.length },
    { label: "Play-Off Slots", value: state.teams.length - confirmedTeams.length },
    { label: "Teams Cleared", value: completedCount },
    { label: "Best Total Score", value: bestAggregate }
  ];

  elements.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <p class="summary-card__label">${card.label}</p>
          <p class="summary-card__value">${card.value}</p>
        </article>
      `
    )
    .join("");
}

function renderDashboard() {
  const groups = confederationOrder
    .map((confederation) => ({
      confederation,
      teams: state.teams.filter((team) => team.confederation === confederation)
    }))
    .filter((group) => group.teams.length > 0);

  elements.dashboard.innerHTML = groups
    .map(
      (group) => `
        <section class="confederation-group" aria-labelledby="${group.confederation}-heading">
          <div class="confederation-group__header">
            <h3 id="${group.confederation}-heading">${group.confederation}</h3>
            <p class="confederation-group__count">${group.teams.length} cards</p>
          </div>
          <div class="team-grid">
            ${group.teams.map((team) => renderTeamCard(team)).join("")}
          </div>
        </section>
      `
    )
    .join("");

  elements.dashboard.querySelectorAll("[data-team-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectTeam(button.getAttribute("data-team-id"));
    });
  });
}

function renderTeamCard(team) {
  const progress = getTeamProgress(team.id);
  const badgeText =
    team.qualificationStatus === "host"
      ? "Host"
      : team.qualificationStatus === "qualified"
        ? "Qualified"
        : "Play-Off";

  const progressText =
    team.qualificationStatus === "playoff"
      ? "Trivia pending"
      : progress.completed
        ? `Best ${progress.bestScore}/5`
        : "Not played";

  const selectedClass = state.selectedTeamId === team.id ? "is-selected" : "";
  const lockedClass = team.qualificationStatus === "playoff" ? "is-locked" : "";

  return `
    <button class="team-card ${selectedClass} ${lockedClass}" type="button" data-team-id="${team.id}">
      <div class="team-card__topline">
        <div>
          <h4 class="team-card__name">${team.displayName}</h4>
          <p class="team-card__meta">${team.tournamentSlot}</p>
        </div>
        <span class="team-card__code">${team.code}</span>
      </div>
      <span class="badge badge--${team.qualificationStatus}">${badgeText}</span>
      <p class="team-card__fact">${team.quickFact}</p>
      <div class="team-card__footer">
        <span class="progress-pill">${progressText}</span>
        <span class="team-card__meta">${team.regionLabel}</span>
      </div>
    </button>
  `;
}

async function selectTeam(teamId) {
  state.selectedTeamId = teamId;
  const team = state.teams.find((entry) => entry.id === teamId);

  if (!team) {
    return;
  }

  const questions = await api.getQuestions(teamId);
  state.quiz = {
    teamId,
    team,
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    score: 0,
    isComplete: false
  };

  renderDashboard();
  renderQuizPanel();
}

function renderQuizPanel() {
  if (!state.quiz) {
    elements.quizPanel.innerHTML = `
      <div class="quiz-panel__empty">
        <p class="section-header__eyebrow">Trivia Arena</p>
        <h2>Select a team</h2>
        <p>Choose a card from the dashboard to start a five-question round.</p>
      </div>
    `;
    return;
  }

  const { team, questions, currentIndex, selectedAnswer, isComplete, score } = state.quiz;

  if (team.qualificationStatus === "playoff" || questions.length === 0) {
    elements.quizPanel.innerHTML = `
      <div class="empty-state">
        <p class="section-header__eyebrow">Trivia Arena</p>
        <h2>${team.displayName}</h2>
        <p>
          This slot is still waiting on the March 2026 play-off winners. Trivia
          unlocks once the final tournament field is complete.
        </p>
        <p class="quiz-card__meta">${team.quickFact}</p>
      </div>
    `;
    return;
  }

  if (isComplete) {
    const progress = getTeamProgress(team.id);
    elements.quizPanel.innerHTML = `
      <article class="result-card">
        <div class="result-card__topline">
          <div>
            <p class="section-header__eyebrow">Round Complete</p>
            <h2>${team.displayName}</h2>
          </div>
          <span class="badge badge--qualified">Final Score</span>
        </div>
        <p class="result-card__score">${score} / ${questions.length}</p>
        <p>${team.quickFact}</p>
        <div class="result-card__stats">
          <span class="stat-chip">Best score: ${progress.bestScore} / ${questions.length}</span>
          <span class="stat-chip">Status: ${progress.completed ? "Completed" : "In progress"}</span>
        </div>
        <div class="quiz-card__footer">
          <button class="button" type="button" id="play-again">Play again</button>
          <button class="button button--secondary" type="button" id="back-dashboard">Choose another team</button>
        </div>
      </article>
    `;

    document.querySelector("#play-again").addEventListener("click", () => restartQuiz(team.id));
    document.querySelector("#back-dashboard").addEventListener("click", () => clearSelection());
    return;
  }

  const question = questions[currentIndex];
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correctAnswer;

  elements.quizPanel.innerHTML = `
    <article class="quiz-card">
      <div class="quiz-card__topline">
        <div>
          <p class="section-header__eyebrow">${team.displayName}</p>
          <h2>Question ${currentIndex + 1} of ${questions.length}</h2>
        </div>
        <span class="badge badge--qualified">${question.category}</span>
      </div>
      <p class="quiz-card__meta">${team.tournamentSlot}</p>
      <p class="quiz-card__prompt">${question.prompt}</p>
      <div class="answer-list" role="list">
        ${question.options
          .map((option) => renderAnswerButton(option, question.correctAnswer, selectedAnswer))
          .join("")}
      </div>
      ${
        answered
          ? `
            <div class="feedback ${isCorrect ? "is-correct" : "is-wrong"}">
              <strong>${isCorrect ? "Correct." : "Not quite."}</strong>
              <span>${question.explanation}</span>
            </div>
          `
          : ""
      }
      <div class="quiz-card__footer">
        <span class="progress-pill">Score ${score}/${questions.length}</span>
        ${
          answered
            ? `<button class="button" type="button" id="next-question">${
                currentIndex + 1 === questions.length ? "See results" : "Next question"
              }</button>`
            : `<span class="team-card__meta">Tap one answer to continue.</span>`
        }
      </div>
    </article>
  `;

  elements.quizPanel.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => submitAnswer(button.getAttribute("data-answer")));
  });

  if (answered) {
    elements.quizPanel.querySelector("#next-question").addEventListener("click", () => nextQuestion());
  }
}

function renderAnswerButton(option, correctAnswer, selectedAnswer) {
  const isSelected = selectedAnswer === option;
  const isCorrect = option === correctAnswer;

  let className = "answer-button";
  if (selectedAnswer !== null && isCorrect) {
    className += " is-correct";
  } else if (isSelected && !isCorrect) {
    className += " is-wrong";
  }

  return `
    <button
      class="${className}"
      type="button"
      data-answer="${escapeAttribute(option)}"
      ${selectedAnswer !== null ? "disabled" : ""}
    >
      ${option}
    </button>
  `;
}

function submitAnswer(option) {
  if (!state.quiz || state.quiz.selectedAnswer !== null) {
    return;
  }

  state.quiz.selectedAnswer = option;
  const currentQuestion = state.quiz.questions[state.quiz.currentIndex];
  if (option === currentQuestion.correctAnswer) {
    state.quiz.score += 1;
  }
  renderQuizPanel();
}

function nextQuestion() {
  if (!state.quiz) {
    return;
  }

  const nextIndex = state.quiz.currentIndex + 1;
  if (nextIndex >= state.quiz.questions.length) {
    state.quiz.isComplete = true;
    persistCompletion();
  } else {
    state.quiz.currentIndex = nextIndex;
    state.quiz.selectedAnswer = null;
  }

  renderQuizPanel();
}

function restartQuiz(teamId) {
  selectTeam(teamId);
}

function clearSelection() {
  state.selectedTeamId = null;
  state.quiz = null;
  renderDashboard();
  renderQuizPanel();
}

function persistCompletion() {
  const { teamId, score } = state.quiz;
  const previous = getTeamProgress(teamId);
  state.progress[teamId] = {
    bestScore: Math.max(previous.bestScore, score),
    completed: true,
    lastPlayedAt: new Date().toISOString()
  };
  saveProgress();
  renderSummary();
  renderDashboard();
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}