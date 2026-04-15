const express = require('express');
const {
    getQuotations,
    getQuotation,
    createQuotation,
    updateQuotation,
    deleteQuotation
} = require('../controllers/quotationController');

const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router
    .route('/')
    .get(getQuotations)
    .post(createQuotation);

router
    .route('/:id')
    .get(getQuotation)
    .put(updateQuotation)
    .delete(deleteQuotation);

module.exports = router;
