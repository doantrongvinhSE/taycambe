const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// GET /api/config - Lấy thông tin cấu hình
router.get('/', configController.getConfig);

// PUT /api/config - Cập nhật thông tin cấu hình
router.put('/', configController.updateConfig);

module.exports = router; 