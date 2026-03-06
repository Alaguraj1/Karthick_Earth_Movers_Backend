const express = require('express');
const {
    register,
    login,
    logout,
    getMe,
    updatePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const router = express.Router();

const { protect, authorize, checkRegisterAuth } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Allow public registration
router.post('/register', register);

module.exports = router;
