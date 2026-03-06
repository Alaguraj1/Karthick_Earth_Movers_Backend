const express = require('express');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
} = require('../controllers/userController');
const { protect, authorize, checkRegisterAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// List users — Owner & Accountant can view
router.get('/', protect, authorize('Owner', 'Accountant'), getUsers);

// Single user
router.get('/:id', protect, authorize('Owner'), getUser);

// Create user — first ever user allowed without auth (bootstrap), else Owner & Accountant
router.post('/', checkRegisterAuth, authorize('Owner', 'Accountant'), createUser);

// Update user — Owner & Accountant
router.put('/:id', protect, authorize('Owner', 'Accountant'), updateUser);

// Reset user password — Owner & Accountant
router.put('/:id/reset-password', protect, authorize('Owner', 'Accountant'), resetUserPassword);

// Delete user — Owner & Accountant
router.delete('/:id', protect, authorize('Owner', 'Accountant'), deleteUser);

module.exports = router;
