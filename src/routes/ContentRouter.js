const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Tạo content mới
router.post('/contents', contentController.createContent);

// Lấy tất cả content
router.get('/contents', contentController.getAllContents);

// Lấy content theo ID
router.get('/contents/:id', contentController.getContentById);

// Cập nhật content
router.put('/contents/:id', contentController.updateContent);

// Xóa content
router.delete('/contents/:id', contentController.deleteContent);

module.exports = router; 