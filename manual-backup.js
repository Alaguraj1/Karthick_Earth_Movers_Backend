const { performWeeklyBackup } = require('./jobs/backupJob');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const run = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected. Running backup...');
        
        await performWeeklyBackup();
        
        console.log('Manual backup process completed.');
        process.exit(0);
    } catch (error) {
        console.error('Manual backup failed:', error);
        process.exit(1);
    }
};

run();
