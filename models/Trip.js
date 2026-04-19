const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: false
    },
    manualVehicleNumber: {
        type: String,
        trim: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour'
    },
    driverName: String,
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        description: 'Linked customer for auto-generating sale'
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportVendor',
        description: 'Linked contractor for 3rd party sales'
    },
    stoneTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoneType',
        required: true
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sales',
        index: true,
        description: 'Link to the generated invoice'
    },
    permitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permit',
        description: 'Link to the transport permit used'
    },
    fromLocation: {
        type: String,
        required: true,
        trim: true
    },
    toLocation: {
        type: String,
        required: true,
        trim: true
    },
    loadQuantity: {
        type: Number,
        required: true
    },
    loadUnit: {
        type: String,
        enum: ['Tons', 'Units', 'Loads'],
        default: 'Tons'
    },
    tripRate: {
        type: Number,
        default: 0,
        description: 'Deprecated'
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Cancelled'],
        default: 'Completed'
    },
    isConvertedToSale: {
        type: Boolean,
        default: false
    },
    saleType: {
        type: String,
        enum: ['Direct', '3rd Party'],
        default: 'Direct'
    },
    notes: String,
    isVendorSettled: {
        type: Boolean,
        default: false
    },
    driverAmount: { type: Number, default: 0 },
    driverBata: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    billUrl: String,
    billNumber: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Calculate profit before saving
TripSchema.pre('save', function () {
    this.totalExpense = (this.driverAmount || 0) + (this.driverBata || 0) + (this.otherExpenses || 0);
    this.netProfit = -this.totalExpense;
});

module.exports = mongoose.model('Trip', TripSchema);
