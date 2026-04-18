const express = require('express');
const router = express.Router();
const {
    getSalaries,
    addSalary,
    updateSalary,
    deleteSalary
} = require('../controllers/operatorSalaryController');

router.route('/')
    .get(getSalaries)
    .post(addSalary);

router.route('/:id')
    .put(updateSalary)
    .delete(deleteSalary);

module.exports = router;
