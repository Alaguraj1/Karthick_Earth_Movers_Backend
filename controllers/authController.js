const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user (Public: first user is Owner, others are Supervisor)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, username, email, password } = req.body;

    // Check if any users exist to determine the role
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'Owner' : 'Supervisor';

    const user = await User.create({
        name,
        username,
        email,
        password,
        role
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide a username and password' });
    }

    // Check for user (by username OR email - case insensitive)
    const user = await User.findOne({
        $or: [
            { username: { $regex: new RegExp(`^${username}$`, 'i') } },
            { email: { $regex: new RegExp(`^${username}$`, 'i') } }
        ]
    }).select('+password');

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Build the reset URL using your frontend application's URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://karthick-earth-movers.vercel.app';
    const resetUrl = `${frontendUrl}/auth/boxed-reset-password/${resetToken}`;

    const textMessage = `You are receiving this email because you (or someone else) requested a password reset. Please click this link to reset your password: \n\n ${resetUrl}`;

    // Nice responsive HTML template for the email
    const htmlMessage = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e79b21;">Password Reset Request</h2>
        <p>We received a request to reset your Karthick Earth Movers dashboard password.</p>
        <p>Click the secure button below to choose a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #032237; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Karthick Earth Movers - Password Reset',
            message: textMessage,
            html: htmlMessage
        });

        res.status(200).json({ success: true, message: 'Email sent successfully. Please check your inbox.' });
    } catch (err) {
        console.error('Error sending reset email:', err);
        // Clear tokens if email fails to send
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    // Normalize role to Title Case for frontend consistency
    const displayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                role: displayRole
            }
        });
};
