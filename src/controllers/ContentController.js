const Content = require('../models/Content');

// Tạo content mới
exports.createContent = async (req, res) => {
  try {
    const { title, idsProduct, type } = req.body;
    
    const content = new Content({
      title,
      idsProduct,
      type
    });

    const savedContent = await content.save();
    res.status(201).json({
      success: true,
      data: savedContent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo content',
      error: error.message
    });
  }
};

// Lấy tất cả content
exports.getAllContents = async (req, res) => {
  try {
    const contents = await Content.find();
    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách content',
      error: error.message
    });
  }
};

// Lấy content theo ID
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy content'
      });
    }
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy content',
      error: error.message
    });
  }
};

// Cập nhật content
exports.updateContent = async (req, res) => {
  try {
    const { title, idsProduct, type, isActive } = req.body;
    
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      { title, idsProduct, type, isActive },
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy content để cập nhật'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật content',
      error: error.message
    });
  }
};

// Xóa content
exports.deleteContent = async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);
    
    if (!deletedContent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy content để xóa'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa content thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa content',
      error: error.message
    });
  }
}; 