const OperatorSalary = require('../models/OperatorSalary');

// @desc    Get all operator salaries
// @route   GET /api/operator-salaries
exports.getSalaries = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;
        let query = {};
        
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const salaries = await OperatorSalary.find(query)
            .populate('operatorId', 'name workType')
            .populate('machineId', 'name vehicleNumber registrationNumber type')
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: salaries.length, data: salaries });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new salary record
// @route   POST /api/operator-salaries
exports.addSalary = async (req, res) => {
    try {
        const salary = await OperatorSalary.create(req.body);
        res.status(201).json({ success: true, data: salary });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update salary record
// @route   PUT /api/operator-salaries/:id
exports.updateSalary = async (req, res) => {
    try {
        let salary = await OperatorSalary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }
        salary = await OperatorSalary.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: salary });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete salary record
// @route   DELETE /api/operator-salaries/:id
exports.deleteSalary = async (req, res) => {
    try {
        const salary = await OperatorSalary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }
        await OperatorSalary.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
