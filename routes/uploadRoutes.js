const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// Storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, 'rec-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
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
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images or PDFs Only!');
    }
}

// Single file upload (existing)
router.post('/', upload.single('bill'), (req, res) => {
    if (req.file == undefined) {
        return res.status(400).json({ success: false, error: 'No file selected' });
    }
    res.status(200).json({
        success: true,
        filePath: `/uploads/${req.file.filename}`
    });
});

// Bulk file upload & matching
// This route accepts multiple files and attempts to link them to Sales based on filename
const Sales = require('../models/Sales');

router.post('/bulk', upload.array('files', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        const results = { matched: 0, total: req.files.length, errors: [] };

        for (const file of req.files) {
            const originalName = file.originalname.toLowerCase();
            const fileNameWithoutExt = path.parse(originalName).name; // e.g., 'rec-123' from 'rec-123.pdf'

            // Try to find a sale with matching receiptNumber OR invoiceNumber
            // We use regex to handle partial matches or exact matches
            const sale = await Sales.findOne({
                $or: [
                    { receiptNumber: { $regex: new RegExp(`^${fileNameWithoutExt}$`, 'i') } },
                    { invoiceNumber: { $regex: new RegExp(`^${fileNameWithoutExt}$`, 'i') } }
                ]
            });

            if (sale) {
                sale.receiptFile = `/uploads/${file.filename}`;
                await sale.save();
                results.matched++;
            } else {
                results.errors.push(`File "${file.originalname}" could not be matched to any Receipt Number or Invoice Number.`);
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
