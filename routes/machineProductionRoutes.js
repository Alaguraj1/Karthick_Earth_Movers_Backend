const express = require('express');
const router = express.Router();
const {
    getProductions,
    createProduction,
    updateProduction,
    deleteProduction,
    getOperatorsForMachine
} = require('../controllers/machineProductionController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const MachineProduction = require('../models/MachineProduction');

router.use(protect); // All production routes are protected

router.route('/')
    .get(getProductions)
    .post(checkEditWindow(MachineProduction), createProduction);

router.route('/:id')
    .put(checkEditWindow(MachineProduction), updateProduction)
    .delete(authorize('Owner'), checkEditWindow(MachineProduction), deleteProduction);

router.get('/operators/:machineId', getOperatorsForMachine);

module.exports = router;
