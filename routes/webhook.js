const express = require('express');
const router = express.Router();

const {
  handleIncomingMessage,
  verifyWebhook
} = require('../services/whatsapp');

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingMessage);

module.exports = router;
