const mongoose = require('mongoose');

const quarryLeaseExpenseSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    expenseType: { type: String, required: true }, // e.g., Monthly Rent, Security Charge, Repair, etc.
    amountType: { type: String, required: true }, // e.g., Cash, Bank, UPI
    amount: { type: Number, required: true },
    notes: { type: String },
    billUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

quarryLeaseExpenseSchema.index({ date: -1 });

module.exports = mongoose.model('QuarryLeaseExpense', quarryLeaseExpenseSchema);
