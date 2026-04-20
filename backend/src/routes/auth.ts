import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { SiweMessage } from "siwe";
import { prisma } from "../lib/prisma";
import { ensureCsrfToken, issueCsrfToken, requireCsrf } from "../middleware/csrf";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ALLOWED_HOST = new URL(FRONTEND_URL).host;
const ALLOWED_ORIGIN = new URL(FRONTEND_URL).origin;
const SEISMIC_CHAIN_ID = 5124;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/nonce", authLimiter, (req, res) => {
  ensureCsrfToken(req);
  const nonce = crypto.randomBytes(16).toString("hex");
  (req.session as any).nonce = nonce;
  res.setHeader("Content-Type", "text/plain");
  res.send(nonce);
});

router.get("/csrf", authLimiter, (req, res) => {
  const csrfToken = ensureCsrfToken(req);
  res.json({
    success: true,
    data: {
      csrfToken,
      headerName: "x-csrf-token",
    },
  });
});

router.post("/verify", authLimiter, requireCsrf, async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({ success: false, message: "Missing message or signature." });
    }

    const siweMessage = new SiweMessage(message);
    const sessionNonce = (req.session as any).nonce;

    if (!sessionNonce || typeof sessionNonce !== "string") {
      return res.status(400).json({ success: false, message: "Missing session nonce. Please request a fresh signature." });
    }

    if (siweMessage.domain !== ALLOWED_HOST) {
      return res.status(400).json({ success: false, message: "Invalid SIWE domain." });
    }

    if (siweMessage.uri !== ALLOWED_ORIGIN) {
      return res.status(400).json({ success: false, message: "Invalid SIWE origin." });
    }

    if (Number(siweMessage.chainId) !== SEISMIC_CHAIN_ID) {
      return res.status(400).json({ success: false, message: "Wrong chain for Seismic authentication." });
    }

    const { data: fields } = await siweMessage.verify({
      signature,
      nonce: sessionNonce,
      domain: ALLOWED_HOST,
    });

    delete (req.session as any).nonce;

    await prisma.user.upsert({
      where: { address: fields.address },
      update: {},
      create: { address: fields.address },
    });

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        return res.status(500).json({ success: false, message: "Session regeneration failed." });
      }

      (req.session as any).siwe = fields;
      const csrfToken = issueCsrfToken(req);

      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ success: false, message: "Session save failed." });
        }
        res.status(200).json({ success: true, data: { address: fields.address, csrfToken, headerName: "x-csrf-token" } });
      });
    });
  } catch (e: any) {
    delete (req.session as any).nonce;
    res.status(400).json({ success: false, message: "SIWE verification failed." });
  }
});

router.get("/me", (req, res) => {
  const address = (req.session as any).siwe?.address;
  if (!address) {
    return res.status(401).json({ success: false, message: "Not connected or invalid session." });
  }
  res.json({ success: true, data: { address } });
});

router.post("/logout", requireCsrf, (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  req.session.destroy(() => {
    res.clearCookie("seismic_signal_session", {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    res.json({ success: true, message: "Logged out securely." });
  });
});

export default router;
