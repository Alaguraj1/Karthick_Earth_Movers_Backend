const Expense = require('../models/Expense');
const Attendance = require('../models/Attendance');
const Labour = require('../models/Labour');
const SparePart = require('../models/SparePart');

// @desc    Get all expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
    try {
        const { category, month, year, startDate, endDate } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (month && year) {
            if (category === 'Labour Wages') {
                const start = new Date(year, month - 1, 1);
                const end = new Date(year, month, 0, 23, 59, 59);

                query.$or = [
                    { salaryMonth: parseInt(month), salaryYear: parseInt(year) },
                    {
                        salaryMonth: { $exists: false },
                        date: { $gte: start, $lte: end }
                    }
                ];
            } else {
                const start = new Date(year, month - 1, 1);
                const end = new Date(year, month, 0, 23, 59, 59);
                query.date = { $gte: start, $lte: end };
            }
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
exports.addExpense = async (req, res) => {
    console.log('Incoming Expense Data:', req.body);
    
    // Clean up empty ObjectId strings
    const oidFields = ['internalSpareId', 'labourId', 'sourceId', 'transportVendorId'];
    oidFields.forEach(field => {
        if (req.body[field] === '') {
            delete req.body[field];
        }
    });

    try {
        if (req.body.category === 'Labour Wages' && req.body.labourId && req.body.salaryMonth && req.body.salaryYear) {
            const existing = await Expense.findOne({
                category: 'Labour Wages',
                labourId: req.body.labourId,
                salaryMonth: req.body.salaryMonth,
                salaryYear: req.body.salaryYear
            });
            if (existing) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Wages for ${req.body.labourName || 'this person'} have already been processed for ${req.body.salaryMonth}/${req.body.salaryYear}. Duplicate entries are not allowed.` 
                });
            }
        }

        const expense = await Expense.create(req.body);

        // Logic for Labour Wages Workflow Interconnectivity
        if (expense.category === 'Labour Wages' && expense.labourId) {
            let filterQuery = {
                isPaid: false
            };

            if (expense.wageType === 'Contract Payment') {
                const vendorLabours = await Labour.find({ contractor: expense.labourId });
                const vendorLabourIds = vendorLabours.map(l => l._id);
                filterQuery.labour = { $in: vendorLabourIds };
            } else {
                filterQuery.labour = expense.labourId;
            }

            if (expense.salaryMonth && expense.salaryYear) {
                const start = new Date(expense.salaryYear, expense.salaryMonth - 1, 1);
                const end = new Date(expense.salaryYear, expense.salaryMonth, 0, 23, 59, 59, 999);
                filterQuery.date = { $gte: start, $lte: end };
            }

            // Find unpaid attendance for this labourer
            const unpaidAttendance = await Attendance.find(filterQuery)
                .sort({ date: -1 })
                .limit(expense.quantity || 1);

            // Mark them as paid and link to this expense
            if (unpaidAttendance.length > 0) {
                const ids = unpaidAttendance.map(a => a._id);
                await Attendance.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            isPaid: true,
                            expenseId: expense._id
                        }
                    }
                );
            }
        }
        // Logic for Machine Maintenance Spare Part Stock Deduction
        if (expense.category === 'Machine Maintenance' && expense.sparePartSource === 'Own' && expense.internalSpareId) {
            await SparePart.findByIdAndUpdate(expense.internalSpareId, {
                $inc: { stockOut: expense.quantity || 1 }
            });
        }

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        console.error('Error adding expense:', error.stack || error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: error.message || 'Server Error' });
        }
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
    // Clean up empty ObjectId strings
    const oidFields = ['internalSpareId', 'labourId', 'sourceId', 'transportVendorId'];
    oidFields.forEach(field => {
        if (req.body[field] === '') {
            req.body[field] = null;
        }
    });

    try {
        const oldExpense = await Expense.findById(req.params.id);
        if (!oldExpense) {
            return res.status(404).json({ success: false, error: 'No expense found' });
        }

        const newExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Stock Adjustment Logic
        if (oldExpense.category === 'Machine Maintenance') {
            const wasOwn = oldExpense.sparePartSource === 'Own' && oldExpense.internalSpareId;
            const isOwn = newExpense.sparePartSource === 'Own' && newExpense.internalSpareId;

            // If it was Own and still is but changed the Spare ID
            if (wasOwn && isOwn && oldExpense.internalSpareId.toString() !== newExpense.internalSpareId.toString()) {
                // Restore old stock
                await SparePart.findByIdAndUpdate(oldExpense.internalSpareId, { $inc: { stockOut: -(oldExpense.quantity || 1) } });
                // Deduct new stock
                await SparePart.findByIdAndUpdate(newExpense.internalSpareId, { $inc: { stockOut: (newExpense.quantity || 1) } });
            } 
            // If it switched from Bought to Own
            else if (!wasOwn && isOwn) {
                await SparePart.findByIdAndUpdate(newExpense.internalSpareId, { $inc: { stockOut: (newExpense.quantity || 1) } });
            }
            // If it switched from Own to Bought
            else if (wasOwn && !isOwn) {
                await SparePart.findByIdAndUpdate(oldExpense.internalSpareId, { $inc: { stockOut: -(oldExpense.quantity || 1) } });
            }
            // If it was Own and still is and Spare ID is same, but quantity changed
            else if (wasOwn && isOwn && (oldExpense.quantity !== newExpense.quantity)) {
                const diff = (newExpense.quantity || 1) - (oldExpense.quantity || 1);
                await SparePart.findByIdAndUpdate(newExpense.internalSpareId, { $inc: { stockOut: diff } });
            }
        }

        res.status(200).json({ success: true, data: newExpense });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'No expense found' });
        }

        // If this was a labour wage expense, reset associated attendance records
        if (expense.category === 'Labour Wages') {
            await Attendance.updateMany(
                { expenseId: expense._id },
                { $set: { isPaid: false }, $unset: { expenseId: 1 } }
            );
        }

        // If this was a machine maintenance expense with internal spare, restore stock
        if (expense.category === 'Machine Maintenance' && expense.sparePartSource === 'Own' && expense.internalSpareId) {
            await SparePart.findByIdAndUpdate(expense.internalSpareId, {
                $inc: { stockOut: -(expense.quantity || 1) }
            });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
