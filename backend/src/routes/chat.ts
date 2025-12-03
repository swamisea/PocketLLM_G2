import { Router } from "express";
import { handleChat } from "../services/chat.service";
import {authenticate} from "../middleware/auth.middleware";
import {getModels} from "../services/admin.service";

const router = Router();

router.post("/", authenticate, handleChat);
router.get("/models", authenticate, getModels);

export default router;
