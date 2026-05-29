const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require('@imagekit/nodejs').default;
const { File } = require('node:buffer');

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL
});

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        cb(null, true);
    }
});

const uploadToImageKit = async (file) => {
    const imageFile = new File([file.buffer], file.originalname, { type: file.mimetype });
    const result = await imagekit.files.upload({
        file: imageFile,
        fileName: file.originalname,
        folder: '/taycam'
    });

    return {
        url: result.url,
        public_id: result.fileId
    };
};

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Invalid field name. Use "image" for single upload or "images" for multiple uploads'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }
    next(err);
};

// Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided. Please use field name "image" in form-data'
            });
        }

        const uploadedFile = await uploadToImageKit(req.file);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: uploadedFile
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

// Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided. Please use field name "images" in form-data'
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(uploadToImageKit));

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading images',
            error: error.message
        });
    }
});

// Apply error handling middleware
router.use(handleMulterError);

module.exports = router; 