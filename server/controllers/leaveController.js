const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res, query) => {
    try {
        let data;
        
        if (req.user.role !== 'admin') {
            data = Leave.find({ employee: req.user.id });
        } else {
            data = Leave.find();
        }

        const leaves = await data.sort({ createdAt: -1 })
            .populate('employee', 'name email')
            .populate('approvedBy', 'name');

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name email')
            .populate('approvedBy', 'name');

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found'
            });
        }

        // Make sure user is owner or admin
        if (leave.employee._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view this leave'
            });
        }

        res.status(200).json({
            success: true,
            data: leave
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create leave
// @route   POST /api/leaves
// @access  Private
exports.createLeave = async (req, res) => {
    try {
        // Add employee to request body
        req.body.employee = req.user.id;
        
        // Get employee details
        const employee = await Employee.findById(req.user.id);
        req.body.employeeName = employee.name;
        req.body.employeeEmail = employee.email;

        const leave = await Leave.create(req.body);

        // Emit socket event for new leave
        const io = req.app.get('socketio');
        io.to('admin_room').emit('newLeave', leave);

        res.status(201).json({
            success: true,
            data: leave
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update leave
// @route   PUT /api/leaves/:id
// @access  Private
exports.updateLeave = async (req, res) => {
    try {
        let leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found'
            });
        }

        // Make sure user is owner or admin
        if (leave.employee.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this leave'
            });
        }

        // Only admin can change status
        if (req.body.status && req.user.role !== 'admin') {
            delete req.body.status;
        }

        // If admin is approving/rejecting, set approvedBy
        if (req.body.status && ['approved', 'rejected'].includes(req.body.status) && req.user.role === 'admin') {
            req.body.approvedBy = req.user.id;
        }

        leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Emit socket event for leave update
        const io = req.app.get('socketio');
        io.to('admin_room').emit('leaveUpdated', leave);
        
        // Notify employee if their leave status changed
        if (req.body.status) {
            io.to(`employee_${leave.employee}`).emit('leaveStatusChanged', leave);
        }

        res.status(200).json({
            success: true,
            data: leave
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private
exports.deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found'
            });
        }

        // Make sure user is owner or admin
        if (leave.employee.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this leave'
            });
        }

        await leave.deleteOne();

        // Emit socket event
        const io = req.app.get('socketio');
        io.to('admin_room').emit('leaveDeleted', req.params.id);

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

// @desc    Get today's leaves
// @route   GET /api/leaves/today
// @access  Private
exports.getTodayLeaves = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const leaves = await Leave.find({
            startDate: { $lte: tomorrow },
            endDate: { $gte: today },
            status: 'approved'
        })
        .populate('employee', 'name email shift')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get leaves by status
// @route   GET /api/leaves/status/:status
// @access  Private/Admin
exports.getLeavesByStatus = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: req.params.status })
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create emergency leave (admin only)
// @route   POST /api/leaves/emergency
// @access  Private/Admin
exports.createEmergencyLeave = async (req, res) => {
    try {
        const { employeeId, startDate, endDate, reason, notes } = req.body;

        // Get employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const leaveData = {
            employee: employeeId,
            employeeName: employee.name,
            employeeEmail: employee.email,
            startDate,
            endDate,
            reason,
            type: 'emergency',
            status: 'approved',
            notes,
            approvedBy: req.user.id
        };

        const leave = await Leave.create(leaveData);

        // Emit socket event for emergency leave
        const io = req.app.get('socketio');
        io.to('admin_room').emit('emergencyLeaveAdded', leave);
        io.to(`employee_${employeeId}`).emit('emergencyLeaveAssigned', leave);

        res.status(201).json({
            success: true,
            data: leave
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get leaves by date range
// @route   GET /api/leaves/bydate
// @access  Private
exports.getLeavesByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide startDate and endDate query parameters'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const query = {
            startDate: { $lte: end },
            endDate: { $gte: start }
        };

        // If not admin, only show own leaves
        if (req.user.role !== 'admin') {
            query.employee = req.user.id;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'name email')
            .populate('approvedBy', 'name')
            .sort({ startDate: 1 });

        // Group leaves by date
        const leavesByDate = {};
        
        leaves.forEach(leave => {
            const currentDate = new Date(leave.startDate);
            const endDateObj = new Date(leave.endDate);
            
            while (currentDate <= endDateObj) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                if (!leavesByDate[dateStr]) {
                    leavesByDate[dateStr] = [];
                }
                
                leavesByDate[dateStr].push({
                    _id: leave._id,
                    employee: leave.employee,
                    employeeName: leave.employeeName || leave.employee?.name,
                    reason: leave.reason,
                    type: leave.type,
                    status: leave.status,
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    notes: leave.notes,
                    isSpanning: leave.startDate.toISOString().split('T')[0] !== dateStr || 
                               leave.endDate.toISOString().split('T')[0] !== dateStr
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        res.status(200).json({
            success: true,
            data: leavesByDate
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};