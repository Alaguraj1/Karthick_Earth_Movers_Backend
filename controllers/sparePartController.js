const SparePart = require('../models/SparePart');
const asyncHandler = require('express-async-handler');

// @desc    Get all spare parts
// @route   GET /api/spare-parts
// @access  Private
exports.getSpareParts = asyncHandler(async (req, res) => {
    const parts = await SparePart.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: parts.length, data: parts });
});

// @desc    Create new spare part
// @route   POST /api/spare-parts
// @access  Private
exports.createSparePart = asyncHandler(async (req, res) => {
    const part = await SparePart.create(req.body);
    res.status(201).json({ success: true, data: part });
});

// @desc    Update spare part
// @route   PUT /api/spare-parts/:id
// @access  Private
exports.updateSparePart = asyncHandler(async (req, res) => {
    const part = await SparePart.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!part) {
        return res.status(404).json({ success: false, message: 'Spare Part not found' });
    }
    res.status(200).json({ success: true, data: part });
});

// @desc    Delete spare part
// @route   DELETE /api/spare-parts/:id
// @access  Private
exports.deleteSparePart = asyncHandler(async (req, res) => {
    const part = await SparePart.findById(req.params.id);
    if (!part) {
        return res.status(404).json({ success: false, message: 'Spare Part not found' });
    }
    await part.deleteOne();
    res.status(200).json({ success: true, data: {} });
});
