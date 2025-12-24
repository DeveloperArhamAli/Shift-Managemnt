const express = require('express');
const router = express.Router();
const {
    getShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift,
    getCurrentShift, // Make sure this is imported
    getCurrentShiftEmployees,
    initializeShifts
} = require('../controllers/shiftController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getShifts);

router.get('/current', getCurrentShift);
router.get('/current/employees', getCurrentShiftEmployees);
router.post('/initialize', authorize('admin'), initializeShifts);

router.get('/:id', getShift);
router.put('/:id', protect, authorize('admin'), updateShift);
router.delete('/:id', protect, authorize('admin'), deleteShift);
router.post('/', protect, authorize('admin'), createShift);

module.exports = router;