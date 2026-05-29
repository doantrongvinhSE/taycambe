const Config = require('../models/Config');
const Product = require('../models/ProductModel');
const {
    collectImages,
    deleteImageKitFiles,
    findRemovedImages,
    getImagePublicId,
    getImageUrl,
    normalizeImages
} = require('../utils/imagekitCleanup');

const filterImagesStillInUse = async (images, currentConfigId) => {
    const candidates = images.filter(getImagePublicId);
    if (candidates.length === 0) return [];

    const candidateUrls = new Set(candidates.map(getImageUrl).filter(Boolean));
    const otherConfig = await Config.findOne({ _id: { $ne: currentConfigId } });
    const products = await Product.find({ isDeleted: false });

    const usedUrls = new Set();
    collectImages(otherConfig?.banners).forEach((image) => {
        const url = getImageUrl(image);
        if (candidateUrls.has(url)) usedUrls.add(url);
    });

    products.forEach((product) => {
        collectImages(product.images).forEach((image) => {
            const url = getImageUrl(image);
            if (candidateUrls.has(url)) usedUrls.add(url);
        });
        product.variants.forEach((variant) => {
            const url = getImageUrl(variant.image);
            if (candidateUrls.has(url)) usedUrls.add(url);
        });
    });

    return candidates.filter((image) => !usedUrls.has(getImageUrl(image)));
};

// Lấy thông tin cấu hình
exports.getConfig = async (req, res) => {
    try {
        const config = await Config.findOne();
        if (!config) {
            // Nếu chưa có config, tạo một config mặc định
            const defaultConfig = new Config({
                logo: '',
                banners: [],
                phone: '',
                email: '',
                address: '',
                socialLinks: {
                    facebook: '',
                    zalo: '',
                    youtube: '',
                    tiktok: ''
                }
            });
            await defaultConfig.save();
            return res.json(defaultConfig);
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật thông tin cấu hình
exports.updateConfig = async (req, res) => {
    try {
        const {
            logo,
            banners,
            phone,
            email,
            address,
            socialLinks
        } = req.body;

        let config = await Config.findOne();
        const oldBanners = config ? [...config.banners] : [];
        const nextBanners = banners !== undefined ? normalizeImages(banners) : undefined;

        if (!config) {
            // Nếu chưa có config, tạo mới với dữ liệu được cung cấp
            config = new Config({
                logo,
                banners: nextBanners || [],
                phone,
                email,
                address,
                socialLinks
            });
        } else {
            // Cập nhật config hiện có
            config.logo = logo || config.logo;
            if (nextBanners !== undefined) config.banners = nextBanners;
            config.phone = phone || config.phone;
            config.email = email || config.email;
            config.address = address || config.address;
            config.socialLinks = {
                ...config.socialLinks,
                ...socialLinks
            };
        }

        await config.save();

        if (nextBanners !== undefined) {
            const removedImages = findRemovedImages(oldBanners, config.banners);
            const deletableImages = await filterImagesStillInUse(removedImages, config._id);
            await deleteImageKitFiles(deletableImages);
        }

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa thông tin cấu hình
exports.deleteConfig = async (req, res) => {
    try {
        const config = await Config.findOne();
        if (!config) {
            return res.status(404).json({ message: 'Config not found' });
        }
        await config.deleteOne();
        res.json({ message: 'Config deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 