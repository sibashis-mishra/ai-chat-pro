import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';
import { checkRequestLimit } from '../middleware/requestLimit.js';

const router = Router();
const chatController = new ChatController();

// POST /api/chat/message - requires request limit check
router.post('/message', checkRequestLimit, chatController.sendMessage.bind(chatController));

// GET /api/chat/history
router.get('/history', chatController.getChatHistory.bind(chatController));

// DELETE /api/chat/history
router.delete('/history', chatController.clearChatHistory.bind(chatController));

// GET /api/chat/usage
router.get('/usage', chatController.getUserUsage.bind(chatController));

export default router; 