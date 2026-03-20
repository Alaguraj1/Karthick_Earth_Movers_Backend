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
    updateDeliveryStatus,
    bulkAddSales
} = require('../controllers/salesController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Sale = require('../models/Sales');

router.use(protect); // All sales routes protected

// Pending payments report - must be before /:id
router.get('/pending-payments', getPendingPayments);
router.post('/bulk', bulkAddSales);

router.route('/').get(getSales).post(checkEditWindow(Sale), addSale);
router.route('/:id')
    .get(getSale)
    .put(checkEditWindow(Sale), updateSale)
    .delete(authorize('Owner'), checkEditWindow(Sale), deleteSale);

router.post('/:id/payment', addPayment);
router.patch('/:id/delivery-status', updateDeliveryStatus);

module.exports = router;
