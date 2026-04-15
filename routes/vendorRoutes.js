const express = require('express');
const router = express.Router();
const LabourContractor = require('../models/LabourContractor');
const Labour = require('../models/Labour');
const TransportVendor = require('../models/TransportVendor');
const VendorPayment = require('../models/VendorPayment');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');

router.use(protect);

// Labour Contractors CRUD
router.get('/labour', async (req, res) => {
    try {
        const contractors = await LabourContractor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contractors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/labour/:id', async (req, res) => {
    try {
        const contractor = await LabourContractor.findById(req.params.id);
        if (!contractor) return res.status(404).json({ success: false, message: 'Contractor not found' });
        const workers = await Labour.find({ contractor: req.params.id, labourType: 'Vendor' }).sort({ name: 1 });
        res.json({ success: true, data: { contractor, workers } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/labour', checkEditWindow(LabourContractor), async (req, res) => {
    try {
        const contractor = await LabourContractor.create(req.body);

        // 3. Auto-populate Labour Master for this contractor's workers
        if (req.body.contracts && Array.isArray(req.body.contracts)) {
            const laboursToCreate = [];
            const updatedContracts = [...req.body.contracts];

            req.body.contracts.forEach((contract, cIdx) => {
                if (contract.labourDetails && Array.isArray(contract.labourDetails)) {
                    contract.labourDetails.forEach((worker, wIdx) => {
                        if (worker.name) {
                            laboursToCreate.push({
                                name: worker.name,
                                mobile: worker.mobile,
                                address: contractor.address,
                                workType: contract.workType,
                                wage: contract.agreedRate,
                                wageType: contract.rateType === 'Monthly Contract' || contract.rateType === 'Per Month' ? 'Monthly' : 'Daily',
                                labourType: 'Vendor',
                                contractor: contractor._id,
                                joiningDate: new Date(),
                                status: 'active'
                            });
                        }
                    });
                }
            });

            if (laboursToCreate.length > 0) {
                const createdLabours = await Labour.insertMany(laboursToCreate);

                // Map created labour names back to the contractor's contract details if needed
                // Currently storing names in labourDetails array in the contractor model
            }
        }

        res.status(201).json({ success: true, data: contractor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/labour/:id', checkEditWindow(LabourContractor), async (req, res) => {
    try {
        const contractor = await LabourContractor.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Update individual labour records based on the updated contracts
        if (req.body.contracts && Array.isArray(req.body.contracts)) {
            // Get all current labours for this contractor
            const existingLabours = await Labour.find({ contractor: contractor._id, labourType: 'Vendor' });

            const laboursToKeep = [];
            const laboursToCreate = [];

            req.body.contracts.forEach(contract => {
                if (contract.labourDetails && Array.isArray(contract.labourDetails)) {
                    contract.labourDetails.forEach(worker => {
                        if (worker.name) {
                            // Check if this labour already exists
                            const existing = existingLabours.find(l =>
                                l.name === worker.name &&
                                l.workType === contract.workType
                            );

                            if (existing) {
                                laboursToKeep.push(existing._id);
                                // Update existing details if changed
                                existing.mobile = worker.mobile;
                                existing.wage = contract.agreedRate;
                                existing.wageType = contract.rateType === 'Monthly Contract' || contract.rateType === 'Per Month' ? 'Monthly' : 'Daily';
                                existing.save();
                            } else {
                                laboursToCreate.push({
                                    name: worker.name,
                                    mobile: worker.mobile,
                                    address: contractor.address,
                                    workType: contract.workType,
                                    wage: contract.agreedRate,
                                    wageType: contract.rateType === 'Monthly Contract' || contract.rateType === 'Per Month' ? 'Monthly' : 'Daily',
                                    labourType: 'Vendor',
                                    contractor: contractor._id,
                                    joiningDate: new Date(),
                                    status: 'active'
                                });
                            }
                        }
                    });
                }
            });

            // Remove labours no longer in the contractor's list
            await Labour.deleteMany({
                contractor: contractor._id,
                labourType: 'Vendor',
                _id: { $nin: laboursToKeep }
            });

            // Create new ones
            if (laboursToCreate.length > 0) {
                await Labour.insertMany(laboursToCreate);
            }
        }

        res.json({ success: true, data: contractor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/labour/:id', authorize('Owner'), checkEditWindow(LabourContractor), async (req, res) => {
    try {
        await LabourContractor.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

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
