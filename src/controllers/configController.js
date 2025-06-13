const Config = require('../models/Config');

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
        
        if (!config) {
            // Nếu chưa có config, tạo mới với dữ liệu được cung cấp
            config = new Config({
                logo,
                banners,
                phone,
                email,
                address,
                socialLinks
            });
        } else {
            // Cập nhật config hiện có
            config.logo = logo || config.logo;
            config.banners = banners || config.banners;
            config.phone = phone || config.phone;
            config.email = email || config.email;
            config.address = address || config.address;
            config.socialLinks = {
                ...config.socialLinks,
                ...socialLinks
            };
        }

        await config.save();
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