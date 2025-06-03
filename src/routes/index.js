const express = require('express');
const router = express.Router();

const productRoutes = require('./ProductRouter');
const categoryRoutes = require('./CategoryRouter');
const uploadRoutes = require('./upload');
// Tất cả API liên quan đến sản phẩm
router.use('/api/v1', productRoutes);
router.use('/api/v1', categoryRoutes);
router.use('/api/v1/upload', uploadRoutes);

// Nếu có thêm các routes khác:
// const userRoutes = require('./user.routes');
// router.use('/users', userRoutes);

module.exports = router;
