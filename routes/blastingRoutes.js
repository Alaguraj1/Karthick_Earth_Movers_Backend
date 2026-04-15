const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getMaterials,
    getRecords, createRecord, getRecordSummary, deleteRecord, getTonsPreview,
    getAdvances, createAdvance, updateAdvance, deleteAdvance,
    getExplosivePayments, createExplosivePayment, updateExplosivePayment, deleteExplosivePayment
} = require('../controllers/blastingController');



router.use(protect);

// Materials
router.route('/materials').get(getMaterials);


// Records (Calculation)
router.get('/records/preview', getTonsPreview);
router.route('/records').get(getRecords).post(createRecord);

router.route('/records/:id').delete(deleteRecord);
router.route('/records/:id/summary').get(getRecordSummary);

// Advances
router.route('/advances').get(getAdvances).post(createAdvance);
router.route('/advances/:id').put(updateAdvance).delete(deleteAdvance);

// Explosive Shop Payments
router.route('/explosive-payments').get(getExplosivePayments).post(createExplosivePayment);
router.route('/explosive-payments/:id').put(updateExplosivePayment).delete(deleteExplosivePayment);

module.exports = router;
