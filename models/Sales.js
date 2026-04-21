const mongoose = require('mongoose');

const salesItemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, 'Please add an item name']
    },
    stoneType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoneType'
    },
    hsnCode: String,
    quantity: {
        type: Number,
        required: [true, 'Please add quantity'],
        min: 0
    },
    unit: {
        type: String,
        default: 'Tons',
        enum: ['Tons', 'Units', 'Kg', 'CFT', 'Loads']
    },
    rate: {
        type: Number,
        default: 0,
        min: 0
    },
    amount: {
        type: Number,
        default: 0,
        min: 0
    },
    gstPercentage: {
        type: Number,
        default: 0
    },
    gstAmount: {
        type: Number,
        default: 0
    }
});

const salesSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    invoiceDate: {
        type: Date,
        required: [true, 'Please add invoice date'],
        default: Date.now
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    contractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportVendor'
    },
    items: [salesItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    gstPercentage: {
        type: Number,
        default: 0
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0
    },
    paymentType: {
        type: String,
        enum: ['Cash', 'Credit'],
        required: [true, 'Please select payment type'],
        default: 'Cash'
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Partial', 'Unpaid'],
        default: 'Unpaid'
    },
    notes: String,
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour'
    },
    driverName: String,
    fromLocation: {
        type: String,
        default: 'Quarry'
    },
    toLocation: String,
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    },
    deliveryStatus: {
        type: String,
        enum: ['open', 'completed'],
        default: 'open'
    },
    receiptNumber: String,
    receiptFile: String,
    tripStartDate: Date,
    tripEndDate: Date,
    saleType: {
        type: String,
        enum: ['Direct', '3rd Party'],
        default: 'Direct'
    },
    permitAmountPerTon: {
        type: Number,
        default: 0
    },
    isThirdPartyVehicle: {
        type: Boolean,
        default: false
    },
    thirdPartyVehicleNumber: {
        type: String,
        trim: true
    },
    ourVehicleCostPerTon: {
        type: Number,
        default: 0
    },
    thirdPartyAmount: {
        type: Number,
        default: 0
    },
    totalPermitAmount: {
        type: Number,
        default: 0
    },
    totalTransportAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Auto-generate invoice number before saving
salesSchema.pre('validate', async function () {
    if (!this.invoiceNumber) {
        // Start from 710. If there are 5 existing, next should be 710 + 5 = 715? 
        // No, usually they mean the "next" one should be 710 or the sequence starts there.
        // Assuming they want the counter to start at 710.
        const count = await mongoose.model('Sales').countDocuments();
        const startNumber = 710; 
        this.invoiceNumber = `INV-${String(startNumber + count).padStart(4, '0')}`;
    }
});

// Calculate totals before saving
salesSchema.pre('save', function () {
    // Recalculate each item amount and gstAmount if not already correct?
    // Actually, usually the controller would have set these, but it's safe to check.
    this.items.forEach(item => {
        item.amount = (item.quantity || 0) * (item.rate || 0);
        item.gstAmount = (item.amount * (item.gstPercentage || 0)) / 100;
    });

    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.gstAmount = this.items.reduce((sum, item) => sum + item.gstAmount, 0);
    
    // Calculate final grand total including 3rd party costs if applicable
    const thirdPartyCalculated = (this.totalPermitAmount || 0) + (this.totalTransportAmount || 0);
    this.grandTotal = this.subtotal + this.gstAmount + (this.saleType === '3rd Party' ? thirdPartyCalculated : 0);
    
    this.balanceAmount = this.grandTotal - this.amountPaid;

    if (this.balanceAmount <= 0) {
        this.paymentStatus = 'Paid';
        this.balanceAmount = 0;
    } else if (this.amountPaid > 0) {
        this.paymentStatus = 'Partial';
    } else {
        this.paymentStatus = 'Unpaid';
    }

    if (this.paymentType === 'Cash') {
        this.amountPaid = this.grandTotal;
        this.balanceAmount = 0;
        this.paymentStatus = 'Paid';
    }
});

module.exports = mongoose.model('Sales', salesSchema);
