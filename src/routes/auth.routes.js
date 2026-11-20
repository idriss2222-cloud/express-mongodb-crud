import { Router } from "express";
import { renderLogin, login, logout, renderRegister, register } from "../controllers/auth.controllers";
import { validateRegister, validateLogin } from "../middleware/validators/auth.validator";

const router = Router();

router.get("/login", renderLogin);
router.post("/login", validateLogin, login);
router.get("/logout", logout);

router.get("/register", renderRegister);
router.post("/register", validateRegister, register);

export default router;
