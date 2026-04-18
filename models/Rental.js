const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        assetType: {
            type: String,
            enum: ['Vehicle', 'Machine'],
            required: true,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
        },
        customerName: {
            type: String,
        },
        driverName: {
            type: String,
        },
        // Rental specific fields
        shiftType: {
            type: String, // 'Day', 'Day/Night' (for Vehicles)
        },
        duration: {
            type: Number, // Hours for Machines, Days for Vehicles
            required: true,
        },
        rate: {
            type: Number,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Partial', 'Paid'],
            default: 'Pending',
        },
        description: {
            type: String,
        },
        startTime: String,
        endTime: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Rental', RentalSchema);
