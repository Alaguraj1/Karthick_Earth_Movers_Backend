const express = require('express');
const router = express.Router();
const {
    getPermits,
    getPermit,
    addPermit,
    updatePermit,
    deletePermit
} = require('../controllers/permitController');

router.route('/')
    .get(getPermits)
    .post(addPermit);

router.route('/:id')
    .get(getPermit)
    .put(updatePermit)
    .delete(deletePermit);

module.exports = router;
