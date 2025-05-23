const Product = require('../models/ProductModel');
const Category = require('../models/Category');

// [GET] /api/products - Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm', error });
  }
};

// [GET] /api/products/:id - Lấy 1 sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm', error });
  }
};

// [POST] /api/products - Tạo mới sản phẩm
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo sản phẩm', error: error.message });
  }
};

// [PUT] /api/products/:id - Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
  }
};

// [DELETE] /api/products/:id - Xoá sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xoá' });
    res.json({ message: 'Đã xoá sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá sản phẩm', error });
  }
};


// [GET] /api/products/category/:categoryId - Lấy sản phẩm theo danh mục
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId }).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm theo danh mục', error: error.message });
  }
};


// [GET] /api/products/search - Tìm kiếm sản phẩm
exports.searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: 'Vui lòng truyền từ khóa tìm kiếm (keyword)' });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },        // tìm theo tên (không phân biệt hoa thường)
      ]
    }).populate('category');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm', error: error.message });
  }
};
