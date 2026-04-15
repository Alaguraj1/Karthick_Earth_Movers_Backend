const mongoose = require('mongoose');

const stoneTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a stone type name'],
        trim: true,
        unique: true
    },
    unit: {
        type: String,
        default: 'Units',
        enum: ['Units', 'Tons', 'Kg', 'Litres']
    },
    hsnCode: {
        type: String,
        default: ''
    },
    gstPercentage: {
        type: Number,
        default: 5
    },
    description: String,
    blastingRatePerTon: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('StoneType', stoneTypeSchema);
