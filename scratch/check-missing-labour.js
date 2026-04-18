const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load models
const Labour = require('../models/Labour');
const Vehicle = require('../models/Vehicle');

dotenv.config();

async function checkSync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const labours = await Labour.find({}, 'name');
        const labourNames = new Set(labours.map(l => l.name.trim().toLowerCase()));

        const vehicles = await Vehicle.find({}, 'driverName operatorName type');
        
        const missingDrivers = [];
        const missingOperators = [];

        vehicles.forEach(v => {
            if (v.driverName && v.driverName.trim()) {
                const name = v.driverName.trim();
                if (!labourNames.has(name.toLowerCase())) {
                    missingDrivers.push(name);
                }
            }
            if (v.operatorName && v.operatorName.trim()) {
                const name = v.operatorName.trim();
                if (!labourNames.has(name.toLowerCase())) {
                    missingOperators.push(name);
                }
            }
        });

        console.log('Missing Drivers:', [...new Set(missingDrivers)]);
        console.log('Missing Operators:', [...new Set(missingOperators)]);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkSync();
