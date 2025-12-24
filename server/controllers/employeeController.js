const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const bcrypt = require('bcryptjs/dist/bcrypt');
const { formatShiftTime } = require('../utils/timeFormatter');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
        const employee = await Employee.create(req.body);
        
        // Emit socket event for new employee
        const io = req.app.get('socketio');
        io.to('admin_room').emit('newEmployee', employee);

        res.status(201).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res) => {
    try {
        let employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const updateData = { ...req.body };
        
        if (updateData.password && updateData.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password;
        }

        employee = await Employee.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        // Emit socket event for employee update
        const io = req.app.get('socketio');
        io.to('admin_room').emit('employeeUpdated', employee);

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        await employee.deleteOne();

        // Emit socket event for employee deletion
        const io = req.app.get('socketio');
        io.to('admin_room').emit('employeeDeleted', req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get employees for today with status
// @route   GET /api/employees/today/status
// @access  Private
exports.getTodayEmployeesStatus = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all employees
        const employees = await Employee.find({ status: 'active' });
        
        // Get today's leaves
        const todayLeaves = await Leave.find({
            startDate: { $lte: tomorrow },
            endDate: { $gte: today },
            status: 'approved'
        }).populate('employee', 'name email');

        // Get today's attendance
        const todayAttendance = await Attendance.find({
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Map leaves to employees
        const leaveMap = {};
        todayLeaves.forEach(leave => {
            if (leave.employee && leave.employee._id) {
                leaveMap[leave.employee._id.toString()] = leave;
            }
        });

        // Map attendance to employees
        const attendanceMap = {};
        todayAttendance.forEach(att => {
            attendanceMap[att.employee.toString()] = att;
        });

        // Prepare response
        const employeesWithStatus = employees.map(employee => {
            const employeeObj = employee.toObject();
            const dayOfWeek = today.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayName = dayNames[dayOfWeek];

            // Check if today is weekly off
            if (employee.weeklyOff && employee.weeklyOff.includes(todayName)) {
                employeeObj.todayStatus = 'weekly_off';
                employeeObj.statusColor = 'gray';
                employeeObj.statusText = 'Weekly Off';
            }
            // Check if on leave
            else if (leaveMap[employee._id.toString()]) {
                employeeObj.todayStatus = 'on_leave';
                employeeObj.statusColor = 'red';
                employeeObj.statusText = 'On Leave';
                employeeObj.leaveReason = leaveMap[employee._id.toString()].reason;
            }
            // Check attendance
            else if (attendanceMap[employee._id.toString()]) {
                const attendance = attendanceMap[employee._id.toString()];
                employeeObj.todayStatus = attendance.status;
                employeeObj.statusColor = attendance.status === 'present' ? 'green' : 'orange';
                employeeObj.statusText = attendance.status === 'present' ? 'Present' : 'Half Day';
            }
            // Default to present
            else {
                employeeObj.todayStatus = 'present';
                employeeObj.statusColor = 'green';
                employeeObj.statusText = 'Present';
            }

            return employeeObj;
        });

        res.status(200).json({
            success: true,
            count: employeesWithStatus.length,
            data: employeesWithStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update employee shift timing
// @route   PUT /api/employees/:id/timing
// @access  Private/Admin
exports.updateEmployeeTiming = async (req, res) => {
    try {
        const { shift, customTiming } = req.body;
        
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        employee.shift = shift || employee.shift;
        if (customTiming) {
            employee.customTiming = customTiming;
        }

        await employee.save();

        // Emit socket event
        const io = req.app.get('socketio');
        io.to(`employee_${employee._id}`).emit('timingUpdated', employee);
        io.to('admin_room').emit('employeeTimingUpdated', employee);

        res.status(200).json({
            success: true,
            data: employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Mark employee attendance
// @route   POST /api/employees/:id/attendance
// @access  Private/Admin
exports.markAttendance = async (req, res) => {
    try {
        const { date, status, notes } = req.body;
        const today = date ? new Date(date) : new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get employee to know their shift
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Determine shift based on employee's shift preference
        let attendanceShift = employee.shift; // Default to employee's assigned shift
        
        // If employee has flexible shift, use their custom timing or default to shift1
        if (employee.shift === 'flexible') {
            attendanceShift = 'shift1'; // Default for flexible shifts
        }

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
            employee: req.params.id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (attendance) {
            attendance.status = status;
            attendance.shift = attendanceShift; // Add shift
            attendance.notes = notes;
            attendance.markedBy = req.user.id;
        } else {
            attendance = await Attendance.create({
                employee: req.params.id,
                date: today,
                shift: attendanceShift, // Add shift
                status,
                notes,
                markedBy: req.user.id
            });
        }

        await attendance.save();

        // Emit socket event
        const io = req.app.get('socketio');
        io.to('admin_room').emit('attendanceMarked', attendance);

        res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};