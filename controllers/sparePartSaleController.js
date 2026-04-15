const SparePartSale = require('../models/SparePartSale');
const SparePart = require('../models/SparePart');
const asyncHandler = require('express-async-handler');

// @desc    Get all spare part sales
// @route   GET /api/spare-parts-sales
// @access  Private
exports.getSales = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.startDate && req.query.endDate) {
        query.date = { 
            $gte: new Date(req.query.startDate), 
            $lte: new Date(req.query.endDate) 
        };
    }

    const sales = await SparePartSale.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: sales.length, data: sales });
});

// @desc    Create new sale entry
// @route   POST /api/spare-parts-sales
// @access  Private
exports.createSale = asyncHandler(async (req, res) => {
    const saleData = req.body;
    
    // Calculate total amount if not explicitly given
    let totalAmount = 0;
    if (saleData.items && saleData.items.length > 0) {
        saleData.items.forEach(item => {
            item.total = item.quantity * item.price;
            totalAmount += item.total;
        });
        saleData.totalAmount = totalAmount;
    }

    const sale = await SparePartSale.create(saleData);

    // Update stockOut for each item in the master
    if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
            await SparePart.findByIdAndUpdate(item.sparePart, {
                $inc: { stockOut: item.quantity }
            });
        }
    }

    res.status(201).json({ success: true, data: sale });
});

// @desc    Delete a sale
// @route   DELETE /api/spare-parts-sales/:id
// @access  Private
exports.deleteSale = asyncHandler(async (req, res) => {
    const sale = await SparePartSale.findById(req.params.id);
    if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale entry not found' });
    }

    // Revert the stockOut for the items
    if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
            await SparePart.findByIdAndUpdate(item.sparePart, {
                $inc: { stockOut: -Math.abs(item.quantity) }
            });
        }
    }

    await sale.deleteOne();
    res.status(200).json({ success: true, data: {} });
});

// @desc    Update a sale
// @route   PUT /api/spare-parts-sales/:id
// @access  Private
exports.updateSale = asyncHandler(async (req, res) => {
    const sale = await SparePartSale.findById(req.params.id);
    if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale entry not found' });
    }

    // Revert old stockOut first
    if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
            await SparePart.findByIdAndUpdate(item.sparePart, {
                $inc: { stockOut: -Math.abs(item.quantity) }
            });
        }
    }

    const saleData = req.body;
    let totalAmount = 0;
    if (saleData.items && saleData.items.length > 0) {
        saleData.items.forEach(item => {
            item.total = item.quantity * item.price;
            totalAmount += item.total;
        });
        saleData.totalAmount = totalAmount;
    }

    // Update sale
    const updatedSale = await SparePartSale.findByIdAndUpdate(req.params.id, saleData, {
        new: true,
        runValidators: true
    });

    // Apply new stockOut
    if (updatedSale.items && updatedSale.items.length > 0) {
        for (const item of updatedSale.items) {
            await SparePart.findByIdAndUpdate(item.sparePart, {
                $inc: { stockOut: item.quantity }
            });
        }
    }

    res.status(200).json({ success: true, data: updatedSale });
});
