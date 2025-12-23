// quiz.js
const API_BASE = "https://ytquiz-backend-rxpq.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[quiz.js] DOMContentLoaded");

  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Main elements
  const quizStatus = document.getElementById("quiz-status");
  const quizSection = document.getElementById("quiz-section");
  const questionCountBadge = document.getElementById("question-count");
  const questionsContainer = document.getElementById("questions-container");
  const submitQuizForm = document.getElementById("submit-quiz-form");

  const resultsSection = document.getElementById("results-section");
  const scoreText = document.getElementById("score-text");
  const resultsDetails = document.getElementById("results-details");

  // Progress bar
  const progressWrapper = document.getElementById("generation-progress-wrapper");
  const progressBar = document.getElementById("generation-progress-bar");

  // Sidebar meta
  const metaSource = document.getElementById("meta-source");
  const metaDifficulty = document.getElementById("meta-difficulty");
  const metaQuestionConfig = document.getElementById("meta-question-config");
  const metaTotalQuestions = document.getElementById("meta-total-questions");

  let currentQuizId = null;
  let currentQuestions = [];
  let progressInterval = null;

  // ---- PROGRESS BAR HELPERS ----
  function startProgress() {
    if (!progressWrapper || !progressBar) {
      console.warn("[quiz.js] Progress elements not found");
      return;
    }
    console.log("[quiz.js] startProgress");
    let progress = 0;
    progressWrapper.classList.remove("d-none");
    progressBar.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");
    progressBar.classList.remove("bg-danger");

    progressInterval = setInterval(() => {
      // Increase until ~90% while waiting
      if (progress < 90) {
        const increment = 5 + Math.random() * 5; // 5–10%
        progress = Math.min(90, progress + increment);
        const rounded = Math.round(progress);
        progressBar.style.width = `${rounded}%`;
        progressBar.setAttribute("aria-valuenow", String(rounded));
      }
    }, 400);
  }

  function finishProgress(success) {
    if (!progressWrapper || !progressBar) return;
    console.log("[quiz.js] finishProgress, success =", success);
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    progressBar.style.width = "100%";
    progressBar.setAttribute("aria-valuenow", "100");
    if (!success) {
      progressBar.classList.add("bg-danger");
    }

    // Hide after short delay
    setTimeout(() => {
      progressWrapper.classList.add("d-none");
      progressBar.classList.remove("bg-danger");
    }, 800);
  }

  // ---- READ QUIZ CONFIG FROM URL ----
  const params = new URLSearchParams(window.location.search);
  const playlistUrl = params.get("playlistUrl");
  const questionsPerVideo = Number(params.get("questionsPerVideo")) || 2;
  const maxVideos = Number(params.get("maxVideos")) || 3;
  const difficulty = (params.get("difficulty") || "mixed").toLowerCase();

  console.log("[quiz.js] params:", {
    playlistUrl,
    questionsPerVideo,
    maxVideos,
    difficulty,
  });

  // Fill sidebar meta (static info before quiz is generated)
  if (playlistUrl && metaSource) {
    let label = "Video or playlist link";
    if (playlistUrl.includes("list=") || playlistUrl.includes("playlist")) {
      label = "Playlist link";
    }
    let displayUrl = playlistUrl;
    if (displayUrl.length > 80) {
      displayUrl = displayUrl.slice(0, 77) + "...";
    }
    metaSource.textContent = `${label}: ${displayUrl}`;
  } else if (metaSource) {
    metaSource.textContent = "Link not available.";
  }

  if (metaDifficulty) {
    const niceDiff =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    metaDifficulty.textContent = niceDiff;
  }

  if (metaQuestionConfig) {
    metaQuestionConfig.textContent = `${questionsPerVideo} question(s) per video, up to ${maxVideos} video(s)`;
  }

  if (!playlistUrl) {
    if (quizStatus) {
      quizStatus.textContent =
        "No quiz configuration found. Please go back to the generator page.";
      quizStatus.classList.remove("text-muted");
      quizStatus.classList.add("text-danger");
    }
    if (progressWrapper) progressWrapper.classList.add("d-none");
    return;
  }

  // ---- GENERATE QUIZ ON LOAD ----
  (async function generateQuizOnLoad() {
    try {
      if (quizStatus) {
        quizStatus.textContent = "Generating quiz… this may take a few seconds.";
        quizStatus.classList.remove("text-danger");
        quizStatus.classList.add("text-muted");
      }

      startProgress();

      console.log("[quiz.js] Calling /generate-quiz at", API_BASE);
      const resp = await fetch(`${API_BASE}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl,
          questionsPerVideo,
          maxVideos,
          difficulty,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate quiz");
      }

      const data = await resp.json();
      console.log("[quiz.js] /generate-quiz success, data:", data);

      currentQuizId = data.quizId;
      currentQuestions = data.questions || [];

      if (!currentQuestions.length) {
        throw new Error("No questions were generated.");
      }

      if (quizStatus) {
        quizStatus.textContent = "";
      }

      renderQuestions(currentQuestions);
      quizSection.classList.remove("d-none");

      if (questionCountBadge) {
        questionCountBadge.textContent = `${currentQuestions.length} question(s)`;
      }
      if (metaTotalQuestions) {
        metaTotalQuestions.textContent = `${currentQuestions.length} question(s) generated`;
      }

      finishProgress(true);
    } catch (err) {
      console.error("[quiz.js] Error generating quiz:", err);
      if (quizStatus) {
        quizStatus.textContent = err.message || "Error generating quiz.";
        quizStatus.classList.remove("text-muted");
        quizStatus.classList.add("text-danger");
      }
      finishProgress(false);
    }
  })();

  function renderQuestions(questions) {
    questionsContainer.innerHTML = "";

    questions.forEach((q, index) => {
      const card = document.createElement("div");
      card.className = "question-card";

      const title = document.createElement("div");
      title.className = "question-title";
      title.textContent = `Q${index + 1}. ${q.question}`;
      card.appendChild(title);

      q.options.forEach((optionText, optIndex) => {
        const label = document.createElement("label");
        label.className = "option-label";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${q.id}`;
        input.value = optIndex;
        input.className = "form-check-input";

        const span = document.createElement("span");
        span.textContent = optionText;

        label.appendChild(input);
        label.appendChild(span);
        card.appendChild(label);
      });

      questionsContainer.appendChild(card);
    });
  }

  // ---- SUBMIT QUIZ ----
  submitQuizForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentQuizId) {
      if (quizStatus) {
        quizStatus.textContent = "No quiz to submit. Please regenerate.";
        quizStatus.classList.remove("text-muted");
        quizStatus.classList.add("text-danger");
      }
      return;
    }

    const answers = [];
    currentQuestions.forEach((q) => {
      const name = `q-${q.id}`;
      const selected = document.querySelector(`input[name="${name}"]:checked`);
      if (selected) {
        answers.push({
          questionId: q.id,
          selectedIndex: Number(selected.value),
        });
      }
    });

    if (!answers.length) {
      if (quizStatus) {
        quizStatus.textContent = "Please answer at least one question.";
        quizStatus.classList.remove("text-muted");
        quizStatus.classList.add("text-danger");
      }
      return;
    }

    try {
      if (quizStatus) {
        quizStatus.textContent = "Submitting your answers…";
        quizStatus.classList.remove("text-danger");
        quizStatus.classList.add("text-muted");
      }

      const resp = await fetch(`${API_BASE}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuizId,
          answers,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to submit quiz");
      }

      const data = await resp.json();
      console.log("[quiz.js] /submit-quiz success:", data);

      showResults(data);

      resultsSection.classList.remove("d-none");
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

      if (quizStatus) {
        quizStatus.textContent = "";
      }
    } catch (err) {
      console.error("[quiz.js] Error submitting quiz:", err);
      if (quizStatus) {
        quizStatus.textContent = err.message || "Error submitting quiz.";
        quizStatus.classList.remove("text-muted");
        quizStatus.classList.add("text-danger");
      }
    }
  });

  function showResults(resultData) {
    const { score, total, percentage, results } = resultData;

    scoreText.textContent = `Score: ${score} / ${total} (${percentage.toFixed(
      1
    )}%)`;

    resultsDetails.innerHTML = "";

    results.forEach((r) => {
      const item = document.createElement("div");
      item.className = "result-item";

      const status = document.createElement("span");
      status.className =
        "result-status " + (r.isCorrect ? "correct" : "incorrect");
      status.textContent = r.isCorrect ? "Correct" : "Incorrect";

      const statusLine = document.createElement("p");
      statusLine.appendChild(status);

      const detail = document.createElement("p");
      detail.className = "mb-1 small";
      detail.textContent = `Your answer index: ${r.selectedIndex}, correct index: ${r.correctIndex}`;

      item.appendChild(statusLine);
      item.appendChild(detail);

      if (r.explanation) {
        const exp = document.createElement("p");
        exp.className = "small text-muted";
        exp.innerHTML = `<em>${r.explanation}</em>`;
        item.appendChild(exp);
      }

      resultsDetails.appendChild(item);
    });
  }
});