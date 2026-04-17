const mongoose = require('mongoose');

const ExplosiveSupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: String,
    mobileNumber: {
        type: String,
        required: true
    },
    alternateNumber: String,
    address: String,
    gstNumber: String,
    panNumber: String,

    // Bank Details
    bankName: String,
    accountNumber: String,
    ifscCode: String,

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('ExplosiveSupplier', ExplosiveSupplierSchema);
