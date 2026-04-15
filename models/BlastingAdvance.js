const mongoose = require('mongoose');

const BlastingAdvanceSchema = new mongoose.Schema({
    blastingId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlastingRecord' },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BlastingAdvance', BlastingAdvanceSchema);
