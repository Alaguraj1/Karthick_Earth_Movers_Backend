const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middlewares/authMiddleware');
const { uploadToCloudinary } = require('../utils/cloudinary');
const Sales = require('../models/Sales');

router.use(protect);

// Multer storage engine for temporary local saving
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, 'temp-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        return cb(null, true);
    } else {
        cb('Error: Only images and PDFs are allowed!');
    }
}

/**
 * @desc    Upload single file to Cloudinary
 * @route   POST /api/upload
 */
router.post('/', upload.single('bill'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file selected' });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.path);

        if (!result) {
            return res.status(500).json({ success: false, error: 'Cloudinary upload failed' });
        }

        res.status(200).json({
            success: true,
            filePath: result.secure_url, // Use the full Cloudinary URL
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @desc    Bulk upload & match to Cloudinary
 * @route   POST /api/upload/bulk
 */
router.post('/bulk', upload.array('files', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        const results = { matched: 0, total: req.files.length, errors: [] };

        for (const file of req.files) {
            const originalName = file.originalname.toLowerCase();
            const fileNameWithoutExt = path.parse(originalName).name;

            // Upload to Cloudinary first
            const uploadResult = await uploadToCloudinary(file.path);

            if (!uploadResult) {
                results.errors.push(`File "${file.originalname}" failed to upload to Cloudinary.`);
                continue;
            }

            // Match with Sales
            const sale = await Sales.findOne({
                $or: [
                    { receiptNumber: { $regex: new RegExp(`^${fileNameWithoutExt}$`, 'i') } },
                    { invoiceNumber: { $regex: new RegExp(`^${fileNameWithoutExt}$`, 'i') } }
                ]
            });

            if (sale) {
                sale.receiptFile = uploadResult.secure_url;
                await sale.save();
                results.matched++;
            } else {
                results.errors.push(`File "${file.originalname}" uploaded but could not be matched to any record.`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully matched ${results.matched} of ${results.total} files.`,
            data: results
        });
    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
