const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, deleteExpense, updateExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Expense = require('../models/Expense');

router.route('/')
    .get(protect, getExpenses)
    .post(protect, checkEditWindow(Expense), addExpense);

router.route('/:id')
    .put(protect, checkEditWindow(Expense), updateExpense)
    .delete(protect, authorize('Owner'), checkEditWindow(Expense), deleteExpense);

module.exports = router;
