const express = require('express');
const router = express.Router();
const {
    getPermits,
    getPermit,
    addPermit,
    updatePermit,
    deletePermit
} = require('../controllers/permitController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkEditWindow } = require('../middlewares/editWindowMiddleware');
const Permit = require('../models/Permit');

router.use(protect); // All permit routes protected

router.route('/')
    .get(getPermits)
    .post(checkEditWindow(Permit), addPermit);

router.route('/:id')
    .get(getPermit)
    .put(checkEditWindow(Permit), updatePermit)
    .delete(authorize('Owner'), checkEditWindow(Permit), deletePermit);

module.exports = router;
