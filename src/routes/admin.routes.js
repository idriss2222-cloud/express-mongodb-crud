import { Router } from "express";
import { renderAdminDashboard, renderUsers, changeUserRole, deleteUser } from "../controllers/admin.controllers";
import { ensureAdmin, ensureAuth } from "../utils/auth.middleware";

const router = Router();

router.get('/admin', ensureAuth, ensureAdmin, renderAdminDashboard);
router.get('/admin/users', ensureAuth, ensureAdmin, renderUsers);
router.post('/admin/users/:id/role', ensureAuth, ensureAdmin, changeUserRole);
router.post('/admin/users/:id/delete', ensureAuth, ensureAdmin, deleteUser);

export default router;
