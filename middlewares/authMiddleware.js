const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // If there's no req.user (e.g. bypassed by checkRegisterAuth), skip this check
        if (!req.user) {
            return next();
        }

        // Convert both the stored role and the required roles to lowercase for comparison
        const userRole = req.user.role.toLowerCase();
        const authorizedRoles = roles.map(r => r.toLowerCase());

        if (!authorizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Protect user registration (allow first user to be created without auth)
exports.checkRegisterAuth = asyncHandler(async (req, res, next) => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        // If no users exist, allow creating the first user (Owner) without auth
        return next();
    }
    // If users do exist, we must enforce protect middleware first
    exports.protect(req, res, next);
});
