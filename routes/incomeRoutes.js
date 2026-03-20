const express = require('express');
const router = express.Router();
const { getIncome, addIncome } = require('../controllers/incomeController');
const { protect } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Income = require('../models/Income');

router.use(protect);

router.route('/')
    .get(getIncome)
    .post(checkEditWindow(Income), addIncome);

module.exports = router;
