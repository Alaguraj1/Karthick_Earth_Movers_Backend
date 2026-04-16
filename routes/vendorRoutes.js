const express = require('express');
const router = express.Router();
const TransportVendor = require('../models/TransportVendor');
const VendorPayment = require('../models/VendorPayment');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');

router.use(protect);

// Transport Vendors CRUD
router.get('/transport', async (req, res) => {
    try {
        const vendors = await TransportVendor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/transport/:id', async (req, res) => {
    try {
        const vendor = await TransportVendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
        const assets = await Vehicle.find({ contractor: req.params.id }).sort({ name: 1 });
        res.json({ success: true, data: { vendor, assets } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/transport', checkEditWindow(TransportVendor), async (req, res) => {
    try {
        const vendor = await TransportVendor.create(req.body);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/transport/:id', checkEditWindow(TransportVendor), async (req, res) => {
    try {
        const vendor = await TransportVendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/transport/:id', authorize('Owner'), checkEditWindow(TransportVendor), async (req, res) => {
    try {
        await TransportVendor.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Payment History CRUD
router.get('/payments', async (req, res) => {
    try {
        const payments = await VendorPayment.find().sort({ date: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/payments', checkEditWindow(VendorPayment), async (req, res) => {
    try {
        const payment = await VendorPayment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/payments/:id', checkEditWindow(VendorPayment), async (req, res) => {
    try {
        const payment = await VendorPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/payments/:id', authorize('Owner'), checkEditWindow(VendorPayment), async (req, res) => {
    try {
        await VendorPayment.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Outstanding Balances List
router.get('/outstanding', async (req, res) => {
    try {
        const bal = await VendorPayment.aggregate([
            {
                $group: {
                    _id: { vendorId: "$vendorId", vendorType: "$vendorType" },
                    totalInvoice: { $sum: "$invoiceAmount" },
                    totalPaid: { $sum: "$paidAmount" },
                    vendorName: { $first: "$vendorName" }
                }
            },
            {
                $project: {
                    vendorId: "$_id.vendorId",
                    vendorType: "$_id.vendorType",
                    totalInvoice: 1,
                    totalPaid: 1,
                    vendorName: 1,
                    balance: { $subtract: ["$totalInvoice", "$totalPaid"] }
                }
            }
        ]);
        res.json({ success: true, data: bal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
