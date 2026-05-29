const Product = require('../models/ProductModel');
const Category = require('../models/Category');
const Config = require('../models/Config');
const {
  collectImages,
  deleteImageKitFiles,
  findRemovedImages,
  getImagePublicId,
  getImageUrl,
  normalizeImage,
  normalizeImages
} = require('../utils/imagekitCleanup');

const getProductImages = (product) => collectImages(
  product?.images,
  product?.variants?.map((variant) => variant.image)
);

const normalizeProductPayload = (payload) => ({
  ...payload,
  images: payload.images !== undefined ? normalizeImages(payload.images) : payload.images,
  variants: Array.isArray(payload.variants)
    ? payload.variants.map((variant) => ({
        ...variant,
        image: normalizeImage(variant.image)
      }))
    : payload.variants
});

const filterImagesStillInUse = async (images, currentProductId) => {
  const candidates = images.filter(getImagePublicId);
  if (candidates.length === 0) return [];

  const candidateUrls = new Set(candidates.map(getImageUrl).filter(Boolean));
  const config = await Config.findOne();
  const products = await Product.find({ _id: { $ne: currentProductId }, isDeleted: false });
  const usedUrls = new Set();

  collectImages(config?.banners).forEach((image) => {
    const url = getImageUrl(image);
    if (candidateUrls.has(url)) usedUrls.add(url);
  });

  products.forEach((product) => {
    getProductImages(product).forEach((image) => {
      const url = getImageUrl(image);
      if (candidateUrls.has(url)) usedUrls.add(url);
    });
  });

  return candidates.filter((image) => !usedUrls.has(getImageUrl(image)));
};

// [GET] /api/products - Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm', error });
  }
};

// [GET] /api/products/:id - Lấy 1 sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false }).populate('category');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm', error });
  }
};

// [POST] /api/products - Tạo mới sản phẩm
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(normalizeProductPayload(req.body));
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo sản phẩm', error: error.message });
  }
};

// [PUT] /api/products/:id - Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });

    const payload = normalizeProductPayload(req.body);
    const updated = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });
    const removedImages = findRemovedImages(getProductImages(oldProduct), getProductImages(updated));
    const deletableImages = await filterImagesStillInUse(removedImages, updated._id);
    await deleteImageKitFiles(deletableImages);

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
  }
};

// [DELETE] /api/products/:id - Xoá sản phẩm (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xoá' });
    res.json({ message: 'Đã xoá sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá sản phẩm', error });
  }
};

// [GET] /api/products/category/:categoryId - Lấy sản phẩm theo danh mục
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.categoryId,
      isDeleted: false 
    }).populate('category');
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
      ],
      isDeleted: false
    }).populate('category');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm', error: error.message });
  }
};
