const express = require('express');
const router = express.Router();
const { getMasterData, addMasterData, updateMasterData, deleteMasterData } = require('../controllers/masterController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');

router.use(protect);

router.route('/:type')
    .get(getMasterData)
    .post(checkEditWindow('params'), addMasterData);

router.route('/:type/:id')
    .put(checkEditWindow('params'), updateMasterData)
    .delete(authorize('Owner'), checkEditWindow('params'), deleteMasterData);

module.exports = router;
