import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "./middleware/logger";
import projectsRouter from "./routes/projects";
import networkRouter from "./routes/network";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import leaderboardRouter from "./routes/leaderboard";

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret === "seismic-signal-v1-secret" || sessionSecret.length < 32) {
  if (isProd) {
    throw new Error("SESSION_SECRET must be set to a strong value in production.");
  }
  console.warn("[Security] SESSION_SECRET is weak or missing. Set a strong secret before public deployment.");
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(
  session({
    name: "seismic_signal_session",
    secret: sessionSecret || "seismic-signal-v1-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(logger);

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/user", userRouter);
app.use("/api/network", networkRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.get("/api/projects/recommend", async (req, res) => {
  const { prisma } = await import("./lib/prisma");
  const count = parseInt(req.query.count as string) || 3;
  const projects = await prisma.project.findMany({
    take: count,
    include: { _count: { select: { votes: true } } },
  });
  res.json({ success: true, data: projects });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nSeismic Signal API running at http://localhost:${PORT}`);
  console.log("   GET /api/projects");
  console.log("   GET /api/projects/featured");
  console.log("   GET /api/projects/recommend?count=3");
  console.log("   GET /api/network\n");
});

export default app;
