const mongoose = require('mongoose');

const OperatorSalarySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    operatorName: {
        type: String,
        required: true
    },
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour'
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    hoursWorked: {
        type: Number,
        required: true,
        default: 0
    },
    hourlyRate: {
        type: Number,
        required: true,
        default: 0
    },
    padiKasu: {
        type: Number,
        default: 0
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'UPI/G-Pay'],
        default: 'Cash'
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('OperatorSalary', OperatorSalarySchema);
