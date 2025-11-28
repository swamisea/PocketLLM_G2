import { Router } from "express";
import {
  listSessions,
  createSession,
  getSession,
  appendMessage,
} from "../services/sessions.service";
import { authenticate} from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, listSessions);
router.post("/", authenticate, createSession);
router.get("/:id", authenticate, getSession);
router.post("/:id/messages", authenticate, appendMessage);

export default router;
