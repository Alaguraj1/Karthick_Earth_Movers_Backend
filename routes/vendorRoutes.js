const express = require('express');
const router = express.Router();
const ExplosiveSupplier = require('../models/ExplosiveSupplier');
const LabourContractor = require('../models/LabourContractor');
const Labour = require('../models/Labour');
const TransportVendor = require('../models/TransportVendor');
const VendorPayment = require('../models/VendorPayment');

// Explosive Suppliers CRUD
router.get('/explosive', async (req, res) => {
    try {
        const suppliers = await ExplosiveSupplier.find().sort({ createdAt: -1 });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/explosive', async (req, res) => {
    try {
        const supplier = await ExplosiveSupplier.create(req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/explosive/:id', async (req, res) => {
    try {
        const supplier = await ExplosiveSupplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/explosive/:id', async (req, res) => {
    try {
        await ExplosiveSupplier.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Labour Contractors CRUD
router.get('/labour', async (req, res) => {
    try {
        const contractors = await LabourContractor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contractors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/labour', async (req, res) => {
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

router.put('/labour/:id', async (req, res) => {
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

router.delete('/labour/:id', async (req, res) => {
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

router.post('/transport', async (req, res) => {
    try {
        const vendor = await TransportVendor.create(req.body);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/transport/:id', async (req, res) => {
    try {
        const vendor = await TransportVendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/transport/:id', async (req, res) => {
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

router.post('/payments', async (req, res) => {
    try {
        const payment = await VendorPayment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.delete('/payments/:id', async (req, res) => {
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
