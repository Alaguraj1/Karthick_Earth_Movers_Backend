const express = require('express');
const router = express.Router();
const {
    getCustomers,
    getCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Customer = require('../models/Customer');

router.use(protect);

router.route('/')
    .get(getCustomers)
    .post(checkEditWindow(Customer), addCustomer);

router.route('/:id')
    .get(getCustomer)
    .put(checkEditWindow(Customer), updateCustomer)
    .delete(authorize('Owner'), checkEditWindow(Customer), deleteCustomer);

module.exports = router;
