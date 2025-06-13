const express = require('express');
const router = express.Router();

const productRoutes = require('./ProductRouter');
const categoryRoutes = require('./CategoryRouter');
const uploadRoutes = require('./upload');
const orderRoutes = require('./orderRoutes');
const configRoutes = require('./configRoutes');
const contentRoutes = require('./ContentRouter');

// Tất cả API liên quan đến sản phẩm
router.use('/api/v1', productRoutes);
router.use('/api/v1', categoryRoutes);
router.use('/api/v1/upload', uploadRoutes);
router.use('/api/v1', contentRoutes);

// Order routes
router.use('/api/orders', orderRoutes);

// Config routes
router.use('/api/config', configRoutes);

// Nếu có thêm các routes khác:
// const userRoutes = require('./user.routes');
// router.use('/users', userRoutes);

module.exports = router;
