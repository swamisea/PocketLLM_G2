import { Router } from "express";
import { authenticate, requireAdminAccess } from "../middleware/auth.middleware";
import {
    getModels,
    addModel,
    removeModel,
    clearUserCache,
    clearAllCache,
} from "../services/admin.service";

const router = Router();

router.get("/models", authenticate, requireAdminAccess, getModels);
router.post("/models", authenticate, requireAdminAccess, addModel);
router.delete("/models/:modelName", authenticate, requireAdminAccess, removeModel);

router.delete("/cache/user/:userId", authenticate, requireAdminAccess, clearUserCache);
router.delete("/cache/all", authenticate, requireAdminAccess, clearAllCache);
export default router;