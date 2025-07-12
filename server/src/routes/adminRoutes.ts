import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();
const adminController = new AdminController();

// PUT /api/admin/user/request-limit
router.put('/user/request-limit', adminController.updateUserRequestLimit.bind(adminController));

// GET /api/admin/special-user
router.get('/special-user', adminController.getSpecialUserInfo.bind(adminController));

export default router; 