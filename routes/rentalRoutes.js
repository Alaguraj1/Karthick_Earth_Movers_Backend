const express = require('express');
const router = express.Router();
const { getRentals, addRental, updateRental, deleteRental } = require('../controllers/rentalController');

router.route('/')
    .get(getRentals)
    .post(addRental);

router.route('/:id')
    .put(updateRental)
    .delete(deleteRental);

module.exports = router;
