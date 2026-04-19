const mongoose = require('mongoose');

const quarryLeaseSettlementSchema = new mongoose.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    date: { type: Date, default: Date.now },
    totalTons: { type: Number, required: true },
    materialBreakdown: [{
        materialName: String,
        tons: Number,
        ratePerTon: Number,
        amount: Number
    }],
    grossAmount: { type: Number, required: true },
    expenseAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

quarryLeaseSettlementSchema.index({ date: -1 });
quarryLeaseSettlementSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('QuarryLeaseSettlement', quarryLeaseSettlementSchema);
