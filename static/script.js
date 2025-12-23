document.addEventListener("DOMContentLoaded", () => {
  // Footer year (if present)
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const generateForm = document.getElementById("generate-form");
  const playlistInput = document.getElementById("playlist-url");
  const questionsPerVideoInput = document.getElementById("questions-per-video");
  const maxVideosInput = document.getElementById("max-videos");
  const difficultySelect = document.getElementById("difficulty");

  if (!generateForm) return;

  generateForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const playlistUrl = playlistInput.value.trim();
    const questionsPerVideo = Number(questionsPerVideoInput.value) || 2;
    const maxVideos = Number(maxVideosInput.value) || 3;
    const difficulty = difficultySelect.value || "mixed";

    if (!playlistUrl) {
      alert("Please enter a YouTube playlist URL.");
      return;
    }

    const params = new URLSearchParams({
      playlistUrl,
      questionsPerVideo: String(questionsPerVideo),
      maxVideos: String(maxVideos),
      difficulty,
    });

    // Redirect to quiz page with settings in URL
    window.location.href = `/quiz?${params.toString()}`;
  });
});