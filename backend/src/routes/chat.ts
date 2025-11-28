import { Router } from "express";
import { handleChat } from "../services/chat.service";
import { authenticate} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, handleChat);

export default router;
