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

// List users — Owner can view
router.get('/', protect, authorize('Owner'), getUsers);

// Single user
router.get('/:id', protect, authorize('Owner'), getUser);

// Create user — first ever user allowed without auth (bootstrap), else Owner 
router.post('/', checkRegisterAuth, authorize('Owner'), createUser);

// Update user — Owner 
router.put('/:id', protect, authorize('Owner'), updateUser);

// Reset user password — Owner 
router.put('/:id/reset-password', protect, authorize('Owner'), resetUserPassword);

// Delete user — Owner 
router.delete('/:id', protect, authorize('Owner'), deleteUser);

module.exports = router;
