const mongoose = require('mongoose');

const BlastingMaterialSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    ratePerTon: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('BlastingMaterial', BlastingMaterialSchema);
