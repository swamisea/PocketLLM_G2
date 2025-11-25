import { Router } from "express";
import { handleChat } from "../services/chat.service";

const router = Router();

router.post("/", handleChat);

export default router;
