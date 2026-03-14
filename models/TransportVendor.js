const mongoose = require('mongoose');

const TransportVendorSchema = new mongoose.Schema({
    // 1. Basic Details
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

    // 2. Bank Details
    bankName: String,
    accountNumber: String,
    ifscCode: String,

    // 3. Vehicle & Rate Details (Multi-vehicle support)
    vehicles: [
        {
            vehicleType: {
                type: String,
                enum: ['Lorry', 'JCB', 'Hitachi', 'Tractor', 'Tipper', 'Other'],
                default: 'Lorry'
            },
            vehicleName: String, // e.g., "Tata Prima", "JCB 3DX"
            vehicleNumber: {
                type: String,
                required: true
            },
            capacity: String, // e.g., "10 Ton", "6 Wheeler"
            ratePerTrip: {
                type: Number,
                required: true
            },
            padiKasu: {
                type: Number,
                default: 0
            },
            // Driver Details
            driverName: String,
            driverMobile: String,
            driverLicenseNumber: String,
            // Document & Permit Details
            insuranceNumber: String,
            insuranceExpiry: Date,
            fcExpiry: Date,
            permitNumber: String,
            permitExpiry: Date
        }
    ],

    // 4. Payment Details
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank', 'UPI'],
        default: 'Bank'
    },
    creditTerms: {
        type: String, // e.g., "7 days", "Per Trip"
        default: 'Per Trip'
    },
    advancePaid: {
        type: Number,
        default: 0
    },
    outstandingBalance: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('TransportVendor', TransportVendorSchema);
