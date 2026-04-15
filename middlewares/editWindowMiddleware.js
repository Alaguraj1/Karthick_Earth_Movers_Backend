const asyncHandler = require('express-async-handler');

// Model Map for Dynamic Lookups
const getModelByType = (type) => {
    const models = {
        'expense-categories': require('../models/ExpenseCategory'),
        'income-sources': require('../models/IncomeSource'),
        'vehicles': require('../models/Vehicle'),
        'customers': require('../models/Customer'),
        'labours': require('../models/Labour'),
        'stone-types': require('../models/StoneType'),

        'vehicle-categories': require('../models/VehicleCategory'),
        'machine-categories': require('../models/MachineCategory'),
        'work-types': require('../models/WorkType'),
        'maintenance-types': require('../models/MaintenanceType'),
    };
    return models[type];
};

/**
 * Middleware to restrict Supervisor from editing/deleting data older than 24 hours
 * AND from entering (POST) data with a date older than 48 hours (Today/Yesterday).
 * @param {import('mongoose').Model|string} ModelSource - The Mongoose model or 'params' to detect from type.
 */
const checkEditWindow = (ModelSource) => asyncHandler(async (req, res, next) => {
    // If user is Owner or Manager, they can bypass the rules
    const role = (req.user.role || '').toLowerCase();
    const bypassRoles = ['owner', 'manager', 'admin']; // Adding admin for safety if it exists

    if (bypassRoles.includes(role)) {
        return next();
    }

    // Apply restriction to ALL other roles (Supervisor, Accountant, etc.)
    let Model = ModelSource;
    if (ModelSource === 'params') {
        const { type } = req.params;
        Model = getModelByType(type);
    }

    if (req.method === 'POST') {
        const entryDate = req.body.date || req.body.invoiceDate || req.body.dateOfSupply || req.body.joiningDate || req.body.purchaseDate;
        if (entryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const logDate = new Date(entryDate);
            logDate.setHours(0, 0, 0, 0);

            // Allow Today or Yesterday
            if (logDate.getTime() !== today.getTime() && logDate.getTime() !== yesterday.getTime() && logDate.getTime() < yesterday.getTime()) {
                return res.status(403).json({
                    success: false,
                    message: 'Only Owner and Manager can enter data older than 48 hours.'
                });
            }
        }
    } else if (req.method === 'PUT' || req.method === 'DELETE') {
        if (!Model) return next();

        const record = await Model.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        // Use createdAt if available, otherwise fallback to date fields
        const creationTime = record.createdAt || record.date || record.invoiceDate || record.purchaseDate || record.joiningDate;

        if (!creationTime) {
            return next();
        }

        const now = new Date();
        const diffInHours = (now - new Date(creationTime)) / (1000 * 60 * 60);

        if (diffInHours > 24) {
            return res.status(403).json({
                success: false,
                message: 'Editing or deleting data is only allowed within 24 hours of its creation for your role. Contact Admin/Manager for changes.'
            });
        }
    }

    next();
});

module.exports = { checkEditWindow };
