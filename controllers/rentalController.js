const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');

// @desc    Get all rentals
// @route   GET /api/rentals
exports.getRentals = async (req, res) => {
    try {
        const { startDate, endDate, assetType } = req.query;
        let query = {};

        if (assetType) {
            query.assetType = assetType;
        }

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const rentals = await Rental.find(query)
            .populate('vehicleId', 'name registrationNumber vehicleNumber type')
            .populate('customerId', 'name companyName mobileNumber')
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: rentals.length, data: rentals });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new rental
// @route   POST /api/rentals
exports.addRental = async (req, res) => {
    try {
        const rental = await Rental.create(req.body);
        res.status(201).json({ success: true, data: rental });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        } else {
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
};

// @desc    Update rental
// @route   PUT /api/rentals/:id
exports.updateRental = async (req, res) => {
    try {
        let rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ success: false, error: 'No rental found' });
        }
        rental = await Rental.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: rental });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete rental
// @route   DELETE /api/rentals/:id
exports.deleteRental = async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ success: false, error: 'No rental found' });
        }
        await Rental.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
