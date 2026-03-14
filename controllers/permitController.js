const Permit = require('../models/Permit');

// @desc    Get all permits
// @route   GET /api/permits
exports.getPermits = async (req, res, next) => {
    try {
        const permits = await Permit.find().populate('vehicleId', 'name vehicleNumber registrationNumber');
        res.status(200).json({ success: true, count: permits.length, data: permits });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single permit
// @route   GET /api/permits/:id
exports.getPermit = async (req, res, next) => {
    try {
        const permit = await Permit.findById(req.params.id).populate('vehicleId', 'name vehicleNumber registrationNumber');
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });
        res.status(200).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Add new permit
// @route   POST /api/permits
exports.addPermit = async (req, res, next) => {
    try {
        const { selectedTripIds, ...permitData } = req.body;
        const Trip = require('../models/Trip');

        // Validation: Check if any selected trips already have a permit
        if (selectedTripIds && selectedTripIds.length > 0) {
            const alreadyPermitted = await Trip.find({
                _id: { $in: selectedTripIds },
                permitId: { $exists: true, $ne: null }
            });

            if (alreadyPermitted.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Validaton Error: ${alreadyPermitted.length} selected trip(s) already have an assigned permit number.`
                });
            }

            permitData.usedTrips = selectedTripIds.length;
            if (permitData.usedTrips >= permitData.totalTripsAllowed) {
                permitData.status = 'Completed';
            }
        }

        const permit = await Permit.create(permitData);

        // Update selected trips to point to this permit
        if (selectedTripIds && selectedTripIds.length > 0) {
            await Trip.updateMany(
                { _id: { $in: selectedTripIds } },
                { permitId: permit._id }
            );
        }

        res.status(201).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Update permit
// @route   PUT /api/permits/:id
exports.updatePermit = async (req, res, next) => {
    try {
        const { selectedTripIds, ...updateData } = req.body;
        const Trip = require('../models/Trip');

        const permit = await Permit.findById(req.params.id);
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });

        // If selectedTripIds provided, validate and sync
        if (selectedTripIds) {
            // Check if any NEWLY selected trips belong to another permit
            const conflicts = await Trip.find({
                _id: { $in: selectedTripIds },
                permitId: { $exists: true, $ne: null, $ne: permit._id }
            });

            if (conflicts.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Validation Error: ${conflicts.length} trips are already linked to another permit.`
                });
            }

            // Sync: Clear permitId for trips that are no longer selected
            await Trip.updateMany(
                { permitId: permit._id, _id: { $nin: selectedTripIds } },
                { permitId: null }
            );

            // Sync: Set permitId for newly selected trips
            await Trip.updateMany(
                { _id: { $in: selectedTripIds } },
                { permitId: permit._id }
            );

            updateData.usedTrips = selectedTripIds.length;
            if (updateData.usedTrips >= (updateData.totalTripsAllowed || permit.totalTripsAllowed)) {
                updateData.status = 'Completed';
            } else {
                updateData.status = 'Active';
            }
        }

        Object.assign(permit, updateData);
        await permit.save();

        res.status(200).json({ success: true, data: permit });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete permit
// @route   DELETE /api/permits/:id
exports.deletePermit = async (req, res, next) => {
    try {
        const permit = await Permit.findByIdAndDelete(req.params.id);
        if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });
        res.status(200).json({ success: true, message: 'Permit deleted' });
    } catch (error) {
        next(error);
    }
};
