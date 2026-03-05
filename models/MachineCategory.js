const mongoose = require('mongoose');

const MachineCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a machine category name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Name can not be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MachineCategory', MachineCategorySchema);
