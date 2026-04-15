const express = require('express');
const router = express.Router();
const { getSales, createSale, deleteSale, updateSale } = require('../controllers/sparePartSaleController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getSales)
    .post(protect, createSale);

router.route('/:id')
    .put(protect, updateSale)
    .delete(protect, deleteSale);

module.exports = router;
