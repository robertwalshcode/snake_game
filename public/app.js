const API_BASE = "https://api.github.com";
const GITHUB_TOKEN = "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";
const snakeLength = 4; // The fixed length of the snake

// Extract GitHub handle from URL
const handle = extractGitHubHandle();

if (handle) {
  document.getElementById("status").textContent = `Loading commit history for @${handle}...`;
  fetchCommitHistory(handle).then((commitData) => {
    if (commitData) {
      document.getElementById("status").textContent = "";
      initializeGrid(commitData);
      startSnake(commitData);
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
    const response = await fetch(`${API_BASE}/users/${handle}/repos`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch repos");

    const repos = await response.json();
    const commitUrls = repos.map((repo) => repo.commits_url.replace("{/sha}", ""));
    const commitPromises = commitUrls.map((url) =>
      fetch(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }).then((res) => (res.ok ? res.json() : [])) // Return empty array if fetch fails
    );

    const commitData = await Promise.all(commitPromises);

    // Aggregate commit counts per day
    const dayCommitCounts = Array(7 * 52).fill(0);
    commitData.flat().forEach((commit) => {
      const date = new Date(commit.commit.author.date);
    
      // Calculate the day of the year (0-364)
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    
      // Adjust dayOfWeek to start on Sunday (GitHub's format)
      const dayOfWeek = (date.getDay() + 6) % 7; // Adjust to start on Sunday
      const weekOfYear = Math.floor(dayOfYear / 7); // Column index
      const index = weekOfYear * 7 + dayOfWeek;
    
      if (index < dayCommitCounts.length) {
        dayCommitCounts[index] += 1; // Increment commit count for the cell
      }
    });

    return dayCommitCounts;
  } catch (error) {
    console.error("Error fetching commit history:", error);
    return null;
  }
}


function initializeGrid(commitData) {
  const gridContainer = document.getElementById("game-container");
  gridContainer.innerHTML = ""; // Clear previous grid

  // Set up the grid layout: 7 rows x 52 columns
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns = `repeat(52, 20px)`;
  gridContainer.style.gridTemplateRows = `repeat(7, 20px)`;
  gridContainer.style.gridGap = "2px";

  // Create grid cells
  commitData.forEach((commitCount, index) => {
    const cell = document.createElement("div");
    cell.className = "grid-cell";

    // Apply color based on commit count
    if (commitCount === 0) {
      cell.style.backgroundColor = "rgba(0, 0, 0, 0.1)"; // Transparent grey
    } else if (commitCount <= 2) {
      cell.style.backgroundColor = "#144622"; // Dark green
    } else if (commitCount <= 5) {
      cell.style.backgroundColor = "#1e6823"; // Medium green
    } else if (commitCount <= 8) {
      cell.style.backgroundColor = "#44a340"; // Bright green
    } else {
      cell.style.backgroundColor = "#8cc665"; // Brightest green
    }

    gridContainer.appendChild(cell);
  });
}


function startSnake(commitData) {
  const gridContainer = document.getElementById("game-container");
  const cells = gridContainer.children;
  let snake = [0, 1, 2, 3]; // Initial snake position (4 cells)
  let direction = 1; // Moves right by default (adjusted for grid layout)

  function updateSnake() {
    // Log the current snake positions
    // console.log("Current snake positions:", snake);
  
    // Clear all previous snake classes
    Array.from(cells).forEach((cell) => cell.classList.remove("snake"));
  
    // Apply the snake class to the new positions
    snake.forEach((index) => {
      if (cells[index]) {
        cells[index].classList.add("snake");
        // console.log(`Cell at index ${index} updated to "snake".`);
      }
    });
  }

  function moveSnake() {
    const head = snake[snake.length - 1];
  
    // Find the brightest cell (highest commit count)
    let maxCommits = 0;
    let targetCell = null;
  
    commitData.forEach((count, index) => {
      if (count > maxCommits && !snake.includes(index)) {
        maxCommits = count;
        targetCell = index;
      }
    });
  
    // If no target is found, stop the game
    if (targetCell === null) {
      clearInterval(interval);
      document.getElementById("status").textContent = "Game Over!";
      return;
    }
  
    // Calculate the row and column for the head and the target cell
    const targetRow = Math.floor(targetCell / 52);
    const targetCol = targetCell % 52;
    const headRow = Math.floor(head / 52);
    const headCol = head % 52;
  
    // Define possible moves
    const possibleMoves = [
      { direction: 52, rowChange: 1, colChange: 0 },  // Down
      { direction: -52, rowChange: -1, colChange: 0 }, // Up
      { direction: 1, rowChange: 0, colChange: 1 },    // Right
      { direction: -1, rowChange: 0, colChange: -1 },  // Left
    ];
  
    // Filter moves to avoid obstacles and prioritize valid paths
    const validMoves = possibleMoves.filter((move) => {
      const next = head + move.direction;
      const nextRow = Math.floor(next / 52);
      const nextCol = next % 52;
  
      // Ensure the move stays within bounds and avoids the snake itself
      return (
        next >= 0 &&
        next < cells.length && // In bounds
        !snake.includes(next) && // Avoid the snake's body
        Math.abs(nextRow - headRow) <= 1 && // Prevent row wrapping
        Math.abs(nextCol - headCol) <= 1 // Prevent column wrapping
      );
    });
  
    // Sort valid moves by proximity to the target
    validMoves.sort((a, b) => {
      const distanceA =
        Math.abs(targetRow - (headRow + a.rowChange)) +
        Math.abs(targetCol - (headCol + a.colChange));
      const distanceB =
        Math.abs(targetRow - (headRow + b.rowChange)) +
        Math.abs(targetCol - (headCol + b.colChange));
      return distanceA - distanceB;
    });
  
    // Choose the best valid move
    let direction = null;
    if (validMoves.length > 0) {
      direction = validMoves[0].direction;
    }
  
    // If no valid move exists, stop the game
    if (direction === null) {
      clearInterval(interval);
      document.getElementById("status").textContent = "Game Over!";
      return;
    }
  
    const next = head + direction;
  
    // Move the snake
    snake.push(next);
    if (snake.length > snakeLength) {
      snake.shift(); // Keep the snake's length constant
    }
  
    // Consume the commit at the next cell
    if (commitData[next] > 0) {
      commitData[next] -= 1; // Reduce commit count
      cells[next].style.backgroundColor = "rgba(0, 0, 0, 0.1)"; // Set to "no commits" color
    }
  
    updateSnake(); // Update the snake's position
  }
  
  const interval = setInterval(moveSnake, 500);
}

// console.log("Target Cell:", targetCell);
// console.log("Snake Head:", head);
// console.log("Possible Moves:", possibleMoves);
// console.log("Chosen Direction:", direction);

// console.log(`Target Cell: ${targetCell}, Max Commits: ${maxCommits}`);

// Array.from(cells).forEach((cell, index) => cell.classList.remove("target"));
// if (targetCell !== null && cells[targetCell]) {
//   cells[targetCell].classList.add("target");
// }