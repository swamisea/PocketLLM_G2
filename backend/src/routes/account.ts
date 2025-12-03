import { Router } from "express";
import {
    createUser,
    loginUser,
    guestLogin,
    guestAvailable,
    adminAvailable,
    adminLogin
} from "../services/account.service";

const router = Router();

router.post("/create-user", createUser);
router.post("/login", loginUser);
router.get("/guest", guestAvailable);
router.post("/guest-login", guestLogin);
router.get("/admin", adminAvailable);
router.post("/admin-login", adminLogin);

export default router;
