import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login
router.post('/login', authController.login.bind(authController));

// POST /api/auth/register
router.post('/register', authController.register.bind(authController));

export default router; 