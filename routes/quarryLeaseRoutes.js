const express = require('express');
const router = express.Router();
const quarryLeaseController = require('../controllers/quarryLeaseController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/expenses', quarryLeaseController.getExpenses);
router.post('/expenses', quarryLeaseController.createExpense);
router.put('/expenses/:id', quarryLeaseController.updateExpense);
router.delete('/expenses/:id', quarryLeaseController.deleteExpense);

router.get('/settlements', quarryLeaseController.getSettlements);
router.post('/settlements', quarryLeaseController.createSettlement);
router.put('/settlements/:id', quarryLeaseController.updateSettlement);
router.delete('/settlements/:id', quarryLeaseController.deleteSettlement);

module.exports = router;
