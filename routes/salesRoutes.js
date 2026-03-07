const express = require('express');
const router = express.Router();
const {
    getSales,
    getSale,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    getPendingPayments,
    updateDeliveryStatus
} = require('../controllers/salesController');

// Pending payments report - must be before /:id
router.get('/pending-payments', getPendingPayments);

router.route('/').get(getSales).post(addSale);
router.route('/:id').get(getSale).put(updateSale).delete(deleteSale);
router.post('/:id/payment', addPayment);
router.patch('/:id/delivery-status', updateDeliveryStatus);

module.exports = router;
