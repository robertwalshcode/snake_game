const API_BASE = "https://api.github.com";
const snakeLength = 4;

// Extract GitHub handle from URL
const handle = extractGitHubHandle();

if (handle) {
  document.getElementById("status").textContent = `Loading game for @${handle}...`;
  fetchCommitHistory(handle).then((commitHistory) => {
    if (commitHistory) {
      document.getElementById("status").textContent = "";
      initializeGame(commitHistory);
    } else {
      document.getElementById("status").textContent = `Could not load commits for @${handle}.`;
    }
  });
} else {
  document.getElementById("status").textContent = "Invalid URL. Please use /profile/{github_handle}.";
}

function extractGitHubHandle() {
  const path = window.location.pathname;
  const match = path.match(/\/profile\/(.+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchCommitHistory(handle) {
  try {
    const response = await fetch(`${API_BASE}/users/${handle}/repos`);
    if (!response.ok) throw new Error("Failed to fetch repos");

    const repos = await response.json();
    const commitUrls = repos.map((repo) => repo.commits_url.replace("{/sha}", ""));
    const commitPromises = commitUrls.map((url) => fetch(url).then((res) => res.json()));

    const commits = await Promise.all(commitPromises);
    return commits.flat();
  } catch (error) {
    console.error("Error fetching commit history:", error);
    return null;
  }
}

function initializeGame(commitHistory) {
  const gridContainer = document.getElementById("game-container");
  gridContainer.innerHTML = ""; // Clear previous grid

  // Generate a mock grid for simplicity (7x7)
  const gridSize = 7;
  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    gridContainer.appendChild(cell);
  }

  // Populate with commits (simplified for now)
  const cells = document.querySelectorAll(".grid-cell");
  commitHistory.slice(0, cells.length).forEach((_, index) => {
    cells[index].classList.add("commit");
  });

  // Initialize the snake
  const snake = [0, 1, 2, 3];
  updateSnake(snake, cells);
  startGame(snake, cells, commitHistory);
}

function updateSnake(snake, cells) {
  cells.forEach((cell) => cell.classList.remove("snake"));
  snake.forEach((index) => cells[index].classList.add("snake"));
}

function startGame(snake, cells, commits) {
  let currentIndex = 0;
  const interval = setInterval(() => {
    if (currentIndex >= commits.length) {
      clearInterval(interval);
      document.getElementById("status").textContent = "Game Over!";
      return;
    }

    // Move the snake
    const head = snake[snake.length - 1];
    snake.push(head + 1); // Simplified: moves right
    snake.shift(); // Remove the tail
    updateSnake(snake, cells);

    // Consume commit
    cells[head + 1]?.classList.remove("commit");
    currentIndex++;
  }, 500);
}