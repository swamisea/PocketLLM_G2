import { Router } from "express";
import {
  listSessions,
  createSession,
  getSession,
  appendMessage,
} from "../services/sessions.service";

const router = Router();

router.get("/", listSessions);
router.post("/", createSession);
router.get("/:id", getSession);
router.post("/:id/messages", appendMessage);

export default router;
