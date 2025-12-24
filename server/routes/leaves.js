const express = require('express');
const router = express.Router();
const {
    getLeaves,
    getLeave,
    createLeave,
    updateLeave,
    deleteLeave,
    getTodayLeaves, // Make sure this is imported
    getLeavesByStatus,
    createEmergencyLeave,
    getLeavesByDate
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getLeaves);
// ✅ SPECIFIC ROUTES FIRST
router.get('/today', getTodayLeaves);
router.get('/status/:status', authorize('admin'), getLeavesByStatus);
router.post('/emergency', authorize('admin'), createEmergencyLeave);
router.get('/bydate', protect, getLeavesByDate);
// ✅ PARAMETERIZED ROUTES LAST
router.get('/:id', getLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);
router.post('/', createLeave);

module.exports = router;