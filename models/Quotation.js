const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        unique: true,
        required: true
    },
    quotationDate: {
        type: Date,
        required: [true, 'Please add quotation date'],
        default: Date.now
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Please select a customer']
    },
    items: [quotationItemSchema],
    subtotal: {
        type: Number,
        required: true,
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
    validUntil: {
        type: Date
    },
    notes: String,
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Converted'],
        default: 'Pending'
    },
    statusUpdatedAt: {
        type: Date
    }
}, { timestamps: true });

// Auto-generate quotation number before saving
quotationSchema.pre('validate', async function () {
    if (!this.quotationNumber) {
        const count = await mongoose.model('Quotation').countDocuments();
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        this.quotationNumber = `QT-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }
});

// Calculate totals before saving
quotationSchema.pre('save', function (next) {
    if (this.isModified('status') || this.isNew) {
        this.statusUpdatedAt = new Date();
    }

    this.items.forEach(item => {
        item.amount = (item.quantity || 0) * (item.rate || 0);
        item.gstAmount = (item.amount * (item.gstPercentage || 0)) / 100;
    });

    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.gstAmount = this.items.reduce((sum, item) => sum + item.gstAmount, 0);
    this.grandTotal = this.subtotal + this.gstAmount;
    next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
