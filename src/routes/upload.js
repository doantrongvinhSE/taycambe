const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dk8av8x0j',
    api_key: '411129311273554',
    api_secret: 'z6b6eDdpHjPFVILQKz5Na1aNBHA'
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'taycam',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
    }
});

const upload = multer({ storage: storage });

// Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Return the image URL
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: req.file.path,
                public_id: req.file.filename
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

module.exports = router; 