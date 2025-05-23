const Category = require('../models/Category');

// Lấy tất cả category
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh mục', error: error.message });
  }
};

// Tạo mới category
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo danh mục', error: error.message });
  }
};

// Cập nhật category
exports.updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
  }
};

// Xoá category
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json({ message: 'Xoá danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá danh mục', error: error.message });
  }
};
