const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files (e.g., your index.html and JavaScript files)
app.use(express.static(path.join(__dirname, "public")));

// Dynamic route for profile/{github_handle}
app.get("/profile/:githubHandle", (req, res) => {
  const githubHandle = req.params.githubHandle;
  // You can use `githubHandle` here for any server-side logic
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});