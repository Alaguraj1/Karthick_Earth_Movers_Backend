const asyncHandler = require('express-async-handler');
const StoneType = require('../models/StoneType');

const BlastingRecord = require('../models/BlastingRecord');
const BlastingAdvance = require('../models/BlastingAdvance');
const BlastingExplosivePayment = require('../models/BlastingExplosivePayment');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

exports.getMaterials = asyncHandler(async (req, res) => {
    const materials = await StoneType.find({ status: { $ne: 'inactive' } }).sort('name');
    res.json({ success: true, data: materials });
});


// ─────────────────────────────────────────────────────────────
// BLASTING RECORDS (Calculation)
// ─────────────────────────────────────────────────────────────

// Internal helper for tonnage calculation
const calculateTotalTons = async (materialId, fromDate, toDate) => {
    const stoneType = await StoneType.findById(materialId);
    if (!stoneType) return 0;


    const trips = await Trip.find({
        stoneTypeId: stoneType._id,
        date: { 
            $gte: new Date(new Date(fromDate).setHours(0, 0, 0, 0)), 
            $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) 
        },
        status: 'Completed'
    });

    return trips.reduce((sum, t) => sum + (t.loadQuantity || 0), 0);
};


exports.getRecords = asyncHandler(async (req, res) => {
    const records = await BlastingRecord.find().populate('items.material').sort({ createdAt: -1 });
    res.json({ success: true, data: records });
});


exports.getTonsPreview = asyncHandler(async (req, res) => {
    const { materials, fromDate, toDate } = req.query;
    if (!materials || !fromDate || !toDate) {
        return res.json({ success: true, data: { totalTons: 0 } });
    }

    const materialIds = Array.isArray(materials) ? materials : materials.split(',');
    
    let totalTons = 0;
    for (const materialId of materialIds) {
        totalTons += await calculateTotalTons(materialId, fromDate, toDate);
    }
    
    res.json({ success: true, data: { totalTons } });
});


exports.createRecord = asyncHandler(async (req, res) => {
    const { items, fromDate, toDate, notes } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ success: false, message: 'At least one material is required' });
    }

    let grandTotalTons = 0;
    let grandTotalAmount = 0;
    const processedItems = [];

    for (const item of items) {
        const tons = await calculateTotalTons(item.material, fromDate, toDate);
        const amount = tons * item.ratePerTon;
        
        processedItems.push({
            material: item.material,
            totalTons: tons,
            ratePerTon: item.ratePerTon,
            amount: amount
        });

        grandTotalTons += tons;
        grandTotalAmount += amount;
    }

    const record = await BlastingRecord.create({
        items: processedItems,
        fromDate,
        toDate,
        totalTons: grandTotalTons,
        totalAmount: grandTotalAmount,
        notes
    });

    const populated = await BlastingRecord.findById(record._id).populate('items.material');
    res.status(201).json({ success: true, data: populated });
});



exports.getRecordSummary = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await BlastingRecord.findById(id).populate('items.material');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Only count deductions whose date falls WITHIN the blasting period
    const dateFilter = {
        $gte: new Date(new Date(record.fromDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(record.toDate).setHours(23, 59, 59, 999))
    };

    const materialIds = record.items.map(i => i.material?._id);
    
    const trips = await Trip.find({
        stoneTypeId: { $in: materialIds },
        date: dateFilter,
        status: 'Completed'
    }).populate('vehicleId', 'vehicleNumber').populate('stoneTypeId', 'name');



    const [advances, explosivePayments, dieselExpenses] = await Promise.all([
        BlastingAdvance.find({
            $or: [{ blastingId: id }, { date: dateFilter, blastingId: null }, { date: dateFilter, blastingId: { $exists: false } }]
        }),
        BlastingExplosivePayment.find({
            $or: [{ blastingId: id }, { date: dateFilter, blastingId: null }, { date: dateFilter, blastingId: { $exists: false } }]
        }),
        Expense.find({
            $or: [
                { category: 'Blasting', date: dateFilter },
                { category: 'Diesel', assetType: 'Blasting', date: dateFilter }
            ]
        })
    ]);

    const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
    const explosiveTotal = explosivePayments.reduce((s, p) => s + p.amount, 0);
    const dieselTotal = dieselExpenses.reduce((s, e) => s + e.amount, 0);
    const finalAmount = record.totalAmount - totalAdvance - dieselTotal - explosiveTotal;

    res.json({
        success: true,
        data: {
            record,
            advances,
            explosivePayments,
            dieselExpenses,
            trips, // New: Include trips list for verification
            totalAdvance,
            explosiveTotal,
            dieselTotal,
            finalAmount
        }
    });
});


exports.deleteRecord = asyncHandler(async (req, res) => {
    await BlastingRecord.findByIdAndDelete(req.params.id);
    await BlastingAdvance.deleteMany({ blastingId: req.params.id });
    await BlastingExplosivePayment.deleteMany({ blastingId: req.params.id });
    res.json({ success: true, data: {} });
});

// ─────────────────────────────────────────────────────────────
// ADVANCES
// ─────────────────────────────────────────────────────────────

exports.getAdvances = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.blastingId) {
        if (req.query.fromDate && req.query.toDate) {
            const dateFilter = {
                $gte: new Date(new Date(req.query.fromDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(req.query.toDate).setHours(23, 59, 59, 999))
            };
            query = {
                $or: [{ blastingId: req.query.blastingId }, { date: dateFilter, blastingId: null }, { date: dateFilter, blastingId: { $exists: false } }]
            };
        } else {
            query = { blastingId: req.query.blastingId };
        }
    }
    const advances = await BlastingAdvance.find(query).sort({ date: -1 });
    res.json({ success: true, data: advances });
});

exports.createAdvance = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    // Remove empty blastingId to avoid ObjectId cast error
    if (!body.blastingId) delete body.blastingId;
    const advance = await BlastingAdvance.create(body);
    res.status(201).json({ success: true, data: advance });
});

exports.updateAdvance = asyncHandler(async (req, res) => {
    const advance = await BlastingAdvance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!advance) return res.status(404).json({ success: false, message: 'Advance not found' });
    res.json({ success: true, data: advance });
});

exports.deleteAdvance = asyncHandler(async (req, res) => {
    await BlastingAdvance.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
});

// ─────────────────────────────────────────────────────────────
// EXPLOSIVE SHOP PAYMENTS
// ─────────────────────────────────────────────────────────────

exports.getExplosivePayments = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.blastingId) {
        if (req.query.fromDate && req.query.toDate) {
            const dateFilter = {
                $gte: new Date(new Date(req.query.fromDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(req.query.toDate).setHours(23, 59, 59, 999))
            };
            query = {
                $or: [{ blastingId: req.query.blastingId }, { date: dateFilter, blastingId: null }, { date: dateFilter, blastingId: { $exists: false } }]
            };
        } else {
            query = { blastingId: req.query.blastingId };
        }
    }
    const payments = await BlastingExplosivePayment.find(query).sort({ date: -1 });
    res.json({ success: true, data: payments });
});

exports.createExplosivePayment = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    // Remove empty blastingId to avoid ObjectId cast error
    if (!body.blastingId) delete body.blastingId;
    const payment = await BlastingExplosivePayment.create(body);
    res.status(201).json({ success: true, data: payment });
});

exports.updateExplosivePayment = asyncHandler(async (req, res) => {
    const payment = await BlastingExplosivePayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
});

exports.deleteExplosivePayment = asyncHandler(async (req, res) => {
    await BlastingExplosivePayment.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
});
