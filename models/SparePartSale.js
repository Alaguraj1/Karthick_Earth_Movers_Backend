const mongoose = require('mongoose');

const sparePartSaleItemSchema = new mongoose.Schema({
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
    spareName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
});

const sparePartSaleSchema = new mongoose.Schema({
    customerName: { type: String, required: [true, 'Please add a customer name'] },
    phoneNumber: { type: String, required: [true, 'Please add a phone number'] },
    vehicleName: { type: String, required: [true, 'Please add a vehicle name'] },
    vehicleNumber: { type: String },
    machineType: { type: String },
    items: [sparePartSaleItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SparePartSale', sparePartSaleSchema);
