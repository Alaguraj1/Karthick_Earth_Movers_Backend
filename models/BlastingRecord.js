const mongoose = require('mongoose');

const BlastingRecordSchema = new mongoose.Schema({
    items: [{
        material: { type: mongoose.Schema.Types.ObjectId, ref: 'StoneType', required: true },
        totalTons: { type: Number, default: 0 },
        ratePerTon: { type: Number, required: true },
        amount: { type: Number, default: 0 }
    }],

    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalTons: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String }
}, { timestamps: true });


module.exports = mongoose.model('BlastingRecord', BlastingRecordSchema);
