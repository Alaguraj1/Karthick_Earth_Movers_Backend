const express = require('express');
const router = express.Router();
const {
    getVehicleCostReport,
    getMaintenanceHistory,
    getFuelTracking,
    getDayBook,
    getCashFlow,
    getProfitLoss,
    getMonthlyYearlySummary,
    getDashboardSummary,
    getComplianceReport
} = require('../controllers/reportController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect); // All report routes require authentication

// ─── Operational Reports ── Accessible by ALL roles ──────────────────────────
// (Vehicle details, fuel tracking, maintenance history, dashboard, compliance)
router.get('/vehicle-cost', getVehicleCostReport);
router.get('/maintenance-history', getMaintenanceHistory);
router.get('/fuel-tracking', getFuelTracking);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/compliance', getComplianceReport);

// ─── Financial Reports ── Owner and Manager only ─────────────────────────────
// (Day Book, Cash Flow, Profit & Loss, Monthly/Yearly Summary)
router.get('/day-book', authorize('Owner', 'Manager'), getDayBook);
router.get('/cash-flow', authorize('Owner', 'Manager'), getCashFlow);
router.get('/profit-loss', authorize('Owner', 'Manager'), getProfitLoss);
router.get('/summary', authorize('Owner', 'Manager'), getMonthlyYearlySummary);

module.exports = router;
