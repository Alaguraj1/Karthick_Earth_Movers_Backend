const QuarryLeaseExpense = require('../models/QuarryLeaseExpense');
const QuarryLeaseSettlement = require('../models/QuarryLeaseSettlement');

// Expenses
exports.createExpense = async (req, res) => {
    try {
        const expense = new QuarryLeaseExpense({ ...req.body, createdBy: req.user?._id });
        await expense.save();
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const expenses = await QuarryLeaseExpense.find(query).sort({ date: -1 });
        res.json({ success: true, data: expenses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const expense = await QuarryLeaseExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, data: expense });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await QuarryLeaseExpense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Settlements
exports.createSettlement = async (req, res) => {
    try {
        const settlement = new QuarryLeaseSettlement({ ...req.body, createdBy: req.user?._id });
        await settlement.save();
        res.status(201).json({ success: true, data: settlement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getSettlements = async (req, res) => {
    try {
        const settlements = await QuarryLeaseSettlement.find().sort({ date: -1 });
        res.json({ success: true, data: settlements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSettlement = async (req, res) => {
    try {
        const settlement = await QuarryLeaseSettlement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });
        res.json({ success: true, data: settlement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteSettlement = async (req, res) => {
    try {
        const settlement = await QuarryLeaseSettlement.findByIdAndDelete(req.params.id);
        if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });
        res.json({ success: true, message: 'Settlement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
