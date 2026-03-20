const mongoose = require('mongoose');

const machineProductionSchema = new mongoose.Schema({
    machine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Please select a machine']
    },
    date: {
        type: Date,
        required: [true, 'Please select a date'],
        default: Date.now
    },
    startTime: {
        type: String,
        required: [true, 'Please select start time']
    },
    endTime: {
        type: String,
        required: [true, 'Please select end time']
    },
    breakTime: {
        type: Number,
        default: 0,
        description: 'Break time in minutes'
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: [true, 'Please select an operator']
    },
    dieselLiters: {
        type: Number,
        default: 0
    },
    workType: {
        type: String,
        required: [true, 'Please specify work type']
    },
    startHmr: {
        type: Number,
        default: 0
    },
    endHmr: {
        type: Number,
        default: 0
    },
    totalHours: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String
    }
}, { timestamps: true });

// Helper to convert HH:MM string to decimal hours
const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
};

// Pre-save hook to calculate total hours based SOLELY on Shift Time (as requested)
machineProductionSchema.pre('save', async function () {
    const breakHours = (this.breakTime || 0) / 60;

    // Always calculate based on Shift Time
    const startTimeDec = timeToDecimal(this.startTime);
    const endTimeDec = timeToDecimal(this.endTime);

    // Handle next-day finish if necessary (e.g., 22:00 to 02:00)
    let timeDiff = endTimeDec - startTimeDec;
    if (timeDiff < 0) timeDiff += 24;

    this.totalHours = Math.max(0, timeDiff - breakHours);
});

module.exports = mongoose.model('MachineProduction', machineProductionSchema);
