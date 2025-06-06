const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');

router.get('/products/search', productController.searchProducts);
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.get('/products/category/:categoryId', productController.getProductsByCategory);
module.exports = router;


