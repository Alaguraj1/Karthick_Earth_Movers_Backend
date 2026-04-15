const mongoose = require('mongoose');

const BlastingExplosivePaymentSchema = new mongoose.Schema({
    blastingId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlastingRecord' },
    shopName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    billUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BlastingExplosivePayment', BlastingExplosivePaymentSchema);
