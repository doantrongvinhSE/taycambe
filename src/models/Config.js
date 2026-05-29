const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    logo: {
        type: String,
        required: true
    },
    banners: [{
        type: mongoose.Schema.Types.Mixed,
        required: true
    }],
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    socialLinks: {
        facebook: String,
        zalo: String,
        youtube: String,
        tiktok: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Config', configSchema); 