const mongoose = require('mongoose');

const WorkTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a work type name'],
            unique: true,
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters']
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot be more than 500 characters']
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('WorkType', WorkTypeSchema);
