import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads
  app.use(express.json());

  // API Route for Admin authentication
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.VERCEL_ADMIN_PASSWORD || "a120780";

    if (password === adminPassword) {
      return res.json({ success: true, token: "admin_token_session_verified_2026" });
    } else {
      return res.status(401).json({ success: false, error: "Senha administrativa incorreta." });
    }
  });

  // Serve static assets from public folder
  app.use(express.static(path.join(process.cwd(), "public")));

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
