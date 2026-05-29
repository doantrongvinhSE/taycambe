const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Lấy tất cả đơn hàng
router.get('/', orderController.getAllOrders);

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Lấy danh sách đơn hàng theo email
router.get('/email/:email', orderController.getOrdersByEmail);

// Lấy danh sách đơn hàng theo số điện thoại
router.get('/phone/:phone', orderController.getOrdersByPhone);

// Lấy chi tiết một đơn hàng
router.get('/:id', orderController.getOrderById);

// Cập nhật trạng thái đơn hàng
router.patch('/:id/status', orderController.updateOrderStatus);

// Cập nhật trạng thái thanh toán
router.patch('/:id/payment', orderController.updatePaymentStatus);

module.exports = router;