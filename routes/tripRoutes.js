const express = require('express');
const {
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripStats,
    convertToSale
} = require('../controllers/tripController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Trip = require('../models/Trip');

const router = express.Router();

router.use(protect); // All trip routes protected

router.route('/')
    .get(getTrips)
    .post(checkEditWindow(Trip), createTrip);

router.get('/stats', getTripStats);
router.post('/:id/convert-to-sale', convertToSale);

router.route('/:id')
    .get(getTrip)
    .put(checkEditWindow(Trip), updateTrip)
    .delete(authorize('Owner'), checkEditWindow(Trip), deleteTrip);

module.exports = router;
