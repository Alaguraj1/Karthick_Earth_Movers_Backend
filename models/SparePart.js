const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please add a spare part name'], unique: true },
    cost: { type: Number, required: [true, 'Please add the price/cost'] },
    stockIn: { type: Number, default: 0 },
    stockOut: { type: Number, default: 0 }
}, { timestamps: true });

// Virtual for current stock
sparePartSchema.virtual('currentStock').get(function() {
    return (this.stockIn || 0) - (this.stockOut || 0);
});

sparePartSchema.set('toJSON', { virtuals: true });
sparePartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SparePart', sparePartSchema);
