const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticate, verifyUserExists } = require('../middleware/auth');
const { sendMessageValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/chats/conversation
 * @desc    Get or create a conversation between two users
 * @access  Private
 */
router.post(
  '/conversation',
  authenticate,
  verifyUserExists,
  chatController.getOrCreateConversation
);

/**
 * @route   GET /api/chats/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
router.get(
  '/conversations',
  authenticate,
  verifyUserExists,
  chatController.getConversations
);

/**
 * @route   POST /api/chats/message
 * @desc    Send a message
 * @access  Private
 */
router.post(
  '/message',
  authenticate,
  verifyUserExists,
  sendMessageValidation,
  chatController.sendMessage
);

/**
 * @route   GET /api/chats/messages/:conversationId
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get(
  '/messages/:conversationId',
  authenticate,
  verifyUserExists,
  chatController.getMessages
);

/**
 * @route   GET /api/chats/unread
 * @desc    Get unread message count for the current user
 * @access  Private
 */
router.get(
  '/unread',
  authenticate,
  verifyUserExists,
  chatController.getUnreadCount
);

module.exports = router;
