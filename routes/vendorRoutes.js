const express = require('express');
const router = express.Router();
const TransportVendor = require('../models/TransportVendor');
const ExplosiveSupplier = require('../models/ExplosiveSupplier');
const VendorPayment = require('../models/VendorPayment');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');

router.use(protect);

// Transport Vendors CRUD
router.get('/transport', async (req, res) => {
    try {
        const vendors = await TransportVendor.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id',
                    foreignField: 'contractor',
                    as: 'linkedVehicles'
                }
            },
            {
                $addFields: {
                    vehicles: {
                        $setUnion: ['$vehicles', '$linkedVehicles']
                    }
                }
            }
        ]);
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

// Explosive Suppliers CRUD
router.get('/explosive', async (req, res) => {
    try {
        const vendors = await ExplosiveSupplier.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/explosive', checkEditWindow(ExplosiveSupplier), async (req, res) => {
    try {
        const vendor = await ExplosiveSupplier.create(req.body);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/explosive/:id', checkEditWindow(ExplosiveSupplier), async (req, res) => {
    try {
        const vendor = await ExplosiveSupplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/explosive/:id', authorize('Owner'), checkEditWindow(ExplosiveSupplier), async (req, res) => {
    try {
        await ExplosiveSupplier.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Payment History CRUD
router.get('/payments', async (req, res) => {
    try {
        const { startDate, endDate, vendorId, paymentType } = req.query;
        let query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (vendorId) query.vendorId = vendorId;
        if (paymentType) query.paymentType = paymentType;

        const payments = await VendorPayment.find(query).sort({ date: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/payments', checkEditWindow(VendorPayment), async (req, res) => {
    try {
        const payment = await VendorPayment.create(req.body);

        // If it's a settlement (contains startDate/endDate), mark trips as settled
        if (payment.paymentType === 'Bill' && payment.startDate && payment.endDate && payment.vendorType === 'TransportVendor') {
            const start = new Date(payment.startDate);
            const end = new Date(payment.endDate);
            end.setHours(23, 59, 59, 999);

            // Find all vehicles for this vendor to match trips
            const vehicles = await Vehicle.find({ contractor: payment.vendorId });
            const vehicleIds = vehicles.map(v => v._id);

            await Trip.updateMany(
                {
                    $or: [
                        { vehicleId: { $in: vehicleIds } },
                        { manualVehicleNumber: { $in: vehicles.map(v => v.vehicleNumber).filter(Boolean) } }
                    ],
                    date: { $gte: start, $lte: end }
                },
                { $set: { isVendorSettled: true } }
            );
        }

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/payments/:id', checkEditWindow(VendorPayment), async (req, res) => {
    try {
        const oldPayment = await VendorPayment.findById(req.params.id);
        const payment = await VendorPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // If it's a settlement and dates/vendor changed, re-sync trips
        if (payment.paymentType === 'Bill' && payment.vendorType === 'TransportVendor') {
            // 1. Un-settle old trips
            if (oldPayment.startDate && oldPayment.endDate) {
                const oldStart = new Date(oldPayment.startDate);
                const oldEnd = new Date(oldPayment.endDate);
                oldEnd.setHours(23, 59, 59, 999);

                const oldVehicles = await Vehicle.find({ contractor: oldPayment.vendorId });
                const oldVehicleIds = oldVehicles.map(v => v._id);

                await Trip.updateMany(
                    {
                        $or: [
                            { vehicleId: { $in: oldVehicleIds } },
                            { manualVehicleNumber: { $in: oldVehicles.map(v => v.vehicleNumber).filter(Boolean) } }
                        ],
                        date: { $gte: oldStart, $lte: oldEnd }
                    },
                    { $set: { isVendorSettled: false } }
                );
            }

            // 2. Settle new trips
            if (payment.startDate && payment.endDate) {
                const newStart = new Date(payment.startDate);
                const newEnd = new Date(payment.endDate);
                newEnd.setHours(23, 59, 59, 999);

                const newVehicles = await Vehicle.find({ contractor: payment.vendorId });
                const newVehicleIds = newVehicles.map(v => v._id);

                await Trip.updateMany(
                    {
                        $or: [
                            { vehicleId: { $in: newVehicleIds } },
                            { manualVehicleNumber: { $in: newVehicles.map(v => v.vehicleNumber).filter(Boolean) } }
                        ],
                        date: { $gte: newStart, $lte: newEnd }
                    },
                    { $set: { isVendorSettled: true } }
                );
            }
        }
        
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/payments/:id', authorize('Owner'), checkEditWindow(VendorPayment), async (req, res) => {
    try {
        const payment = await VendorPayment.findById(req.params.id);
        if (payment && payment.paymentType === 'Bill' && payment.startDate && payment.endDate && payment.vendorType === 'TransportVendor') {
            const start = new Date(payment.startDate);
            const end = new Date(payment.endDate);
            end.setHours(23, 59, 59, 999);

            const vehicles = await Vehicle.find({ contractor: payment.vendorId });
            const vehicleIds = vehicles.map(v => v._id);

            await Trip.updateMany(
                {
                    $or: [
                        { vehicleId: { $in: vehicleIds } },
                        { manualVehicleNumber: { $in: vehicles.map(v => v.vehicleNumber).filter(Boolean) } }
                    ],
                    date: { $gte: start, $lte: end }
                },
                { $set: { isVendorSettled: false } }
            );
        }
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
                    totalDeductions: { $sum: { $ifNull: ["$deductionsAmount", 0] } },
                    totalPaid: { $sum: "$paidAmount" },
                    vendorName: { $first: "$vendorName" }
                }
            },
            {
                $project: {
                    vendorId: "$_id.vendorId",
                    vendorType: "$_id.vendorType",
                    totalInvoice: 1,
                    totalDeductions: 1,
                    totalPaid: 1,
                    vendorName: 1,
                    balance: { 
                        $subtract: [
                            "$totalInvoice", 
                            { $add: ["$totalDeductions", "$totalPaid"] }
                        ]
                    }
                }
            }
        ]);
        res.json({ success: true, data: bal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
