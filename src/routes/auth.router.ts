import {Router} from "express";
import {login, recoverPassword, register, resetPassword} from "../controllers/authController";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/recover-password', recoverPassword);
router.post('/reset-password', resetPassword);

export default router;