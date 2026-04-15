const Quotation = require('../models/Quotation');
const asyncHandler = require('express-async-handler');


// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = asyncHandler(async (req, res) => {

    const quotations = await Quotation.find().populate('customer');
    res.status(200).json({ success: true, count: quotations.length, data: quotations });
});

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotation = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.status(200).json({ success: true, data: quotation });
});


// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
exports.createQuotation = asyncHandler(async (req, res) => {

    const quotation = await Quotation.create(req.body);
    res.status(201).json({ success: true, data: quotation });
});

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = asyncHandler(async (req, res) => {
    let quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (req.body.status && req.body.status !== quotation.status) {
        req.body.statusUpdatedAt = new Date();
    }

    quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.status(200).json({ success: true, data: quotation });
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
exports.deleteQuotation = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await quotation.deleteOne();
    res.status(200).json({ success: true, data: {} });
});
