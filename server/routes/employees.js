const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getTodayEmployeesStatus,
    updateEmployeeTiming,
    markAttendance
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(authorize('admin'), getEmployees)
    .post(authorize('admin'), createEmployee);
    
router.get('/today/status', getTodayEmployeesStatus);

router.route('/:id')
    .get(getEmployee)
    .put(authorize('admin'), updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

router.put('/:id/timing', authorize('admin'), updateEmployeeTiming);
router.post('/:id/attendance', authorize('admin'), markAttendance);

module.exports = router;