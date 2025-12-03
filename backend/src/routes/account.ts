import { Router } from "express";
import {
    createUser,
    loginUser,
    guestLogin,
    guestAvailable,
    adminAvailable,
    adminLogin, 
    updateUserPreferences
} from "../services/account.service";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/create-user", createUser);
router.post("/login", loginUser);
router.get("/guest", guestAvailable);
router.post("/guest-login", guestLogin);
router.get("/admin", adminAvailable);
router.post("/admin-login", adminLogin);
router.put("/update-preferences", updateUserPreferences);

export default router;
