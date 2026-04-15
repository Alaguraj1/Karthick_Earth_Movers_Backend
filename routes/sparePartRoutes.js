const express = require('express');
const router = express.Router();
const { getSpareParts, createSparePart, updateSparePart, deleteSparePart } = require('../controllers/sparePartController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getSpareParts)
    .post(protect, createSparePart);

router.route('/:id')
    .put(protect, updateSparePart)
    .delete(protect, deleteSparePart);

module.exports = router;
