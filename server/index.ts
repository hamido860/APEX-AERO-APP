import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Serve static files
// Note: In Vercel, we typically let the platform serve static files,
// but we keep this for local dev and fallback.
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

app.use(express.static(staticPath));

// Add a test API route to verify the server is working
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Handle client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

export default app;
