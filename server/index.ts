import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Use process.cwd() for more robust path resolution in serverless environments
const rootDir = process.cwd();

// Serve static files
// In Vercel, static files are usually served via rewrites,
// but we keep this for local dev and as a fallback.
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.join(rootDir, "dist", "public")

// Serve static files from dist/public in production
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

app.use(express.static(staticPath));

// Add a test API route to verify the server is working
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running", env: process.env.NODE_ENV });
});

// Handle client-side routing
app.get("*", (req, res, next) => {
  // If it's an API route that didn't match anything above, return 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found" });
  }

  const indexPath = path.join(staticPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res.status(500).send("Internal Server Error: Missing frontend build");
    }
  });
});

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Handle client-side routing - serve index.html for all routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// For local development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Export for Vercel serverless functions
export default app;
