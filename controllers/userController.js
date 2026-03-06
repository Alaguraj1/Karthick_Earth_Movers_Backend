const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Owner, Accountant)
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Owner)
exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
});

// @desc    Create a user
// @route   POST /api/users
// @access  Private (Owner or Accountant)
exports.createUser = asyncHandler(async (req, res) => {
    const { name, username, email, password, role } = req.body;

    // Hierarchy check: Accountant cannot create Owner
    if (req.user.role === 'Accountant' && role === 'Owner') {
        return res.status(403).json({ success: false, message: 'Accountants cannot create Owners' });
    }

    // Check if username already exists
    const existing = await User.findOne({ username });
    if (existing) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const user = await User.create({ name, username, email, password, role });
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, data: userObj });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Owner or Accountant)
exports.updateUser = asyncHandler(async (req, res) => {
    const { name, username, email, role, status } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hierarchy check: Accountant cannot modify an Owner
    if (req.user.role === 'Accountant' && user.role === 'Owner') {
        return res.status(403).json({ success: false, message: 'Accountants cannot modify Owner accounts' });
    }

    // Accountant cannot promote someone to Owner
    if (req.user.role === 'Accountant' && role === 'Owner') {
        return res.status(403).json({ success: false, message: 'Accountants cannot assign the Owner role' });
    }

    // Prevent username conflicts
    if (username && username !== user.username) {
        const dup = await User.findOne({ username });
        if (dup) {
            return res.status(400).json({ success: false, message: 'Username already in use' });
        }
    }

    user = await User.findByIdAndUpdate(
        req.params.id,
        { name, username, email, role, status },
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user });
});

// @desc    Reset a user's password (Owner sets it directly)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Owner only)
exports.resetUserPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Owner or Accountant)
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user?.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Hierarchy check: Accountant cannot delete an Owner
    if (req.user.role === 'Accountant' && user.role === 'Owner') {
        return res.status(403).json({ success: false, message: 'Accountants cannot delete Owner accounts' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
});
