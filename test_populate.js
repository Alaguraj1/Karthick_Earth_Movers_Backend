const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas to avoid "MissingSchemaError"
const salesItemSchema = new mongoose.Schema({ item: String });
const salesSchema = new mongoose.Schema({
    invoiceNumber: String,
    saleType: String,
    contractor: mongoose.Schema.Types.ObjectId
});
mongoose.model('Sales', salesSchema);

const TripSchema = new mongoose.Schema({
    date: Date,
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales' }
});
const Trip = mongoose.model('Trip', TripSchema);

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/karthick-earth-movers');
        console.log('Connected to DB');
        
        const trips = await Trip.find({})
            .populate('saleId', 'invoiceNumber saleType contractor')
            .limit(5);
            
        console.log('Populated Trips:', JSON.stringify(trips, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
