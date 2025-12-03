import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { recentTelemetry } from "../services/telemetry.service";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "50", 10);
  const events = await recentTelemetry(limit);
  res.json({ events });
});

export default router;
