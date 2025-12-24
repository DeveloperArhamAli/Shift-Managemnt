const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const { formatShiftTime, convertTo12HourFormat } = require('../utils/timeFormatter');

// @desc    Get all shifts
// @route   GET /api/shifts
// @access  Private
exports.getShifts = async (req, res) => {
    try {
        const shifts = await Shift.find().sort({ startTime: 1 });
        
        // Format all shifts with 12-hour time
        const formattedShifts = shifts.map(shift => formatShiftTime(shift));
        
        res.status(200).json({
            success: true,
            count: formattedShifts.length,
            data: formattedShifts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single shift
// @route   GET /api/shifts/:id
// @access  Private
exports.getShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // Format shift with 12-hour time
        const formattedShift = formatShiftTime(shift);

        res.status(200).json({
            success: true,
            data: formattedShift
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create shift
// @route   POST /api/shifts
// @access  Private/Admin
exports.createShift = async (req, res) => {
    try {
        const startTime = req.body.startTime.split(':');
        const endTime = req.body.endTime.split(':');
        
        // Check if start time is before end time
        if (startTime[0] > endTime[0] || (startTime[0] === endTime[0] && startTime[1] > endTime[1])) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be before end time'
            });
        }
        
        const shift = await Shift.create(req.body);
        
        res.status(201).json({
            success: true,
            data: shift
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update shift
// @route   PUT /api/shifts/:id
// @access  Private/Admin
exports.updateShift = async (req, res) => {
    try {
        let shift = await Shift.findById(req.params.id);
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: shift
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete shift
// @route   DELETE /api/shifts/:id
// @access  Private/Admin
exports.deleteShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id);
        
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // Check if any employee is assigned to this shift
        const employeesCount = await Employee.countDocuments({ shift: shift.code });
        if (employeesCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete shift. ${employeesCount} employees are assigned to this shift.`
            });
        }

        await shift.deleteOne();

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

// @desc    Get current shift based on time
// @route   GET /api/shifts/current
// @access  Private
exports.getCurrentShift = async (req, res) => {
    try {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const shifts = await Shift.find({ isActive: true });
        
        let currentShift = null;
        
        for (const shift of shifts) {
            const [startHour, startMinute] = shift.startTime.split(':').map(Number);
            const [endHour, endMinute] = shift.endTime.split(':').map(Number);
            
            const startTime = startHour * 60 + startMinute;
            let endTime = endHour * 60 + endMinute;
            
            // Handle overnight shifts (end time < start time)
            if (endTime < startTime) {
                endTime += 24 * 60;
                const adjustedCurrentTime = currentTime < startTime ? 
                    currentTime + 24 * 60 : currentTime;
                
                if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                    currentShift = shift;
                    break;
                }
            } else {
                if (currentTime >= startTime && currentTime < endTime) {
                    currentShift = shift;
                    break;
                }
            }
        }
        
        if (!currentShift) {
            return res.status(404).json({
                success: false,
                message: 'No active shift found'
            });
        }

        // Format shift with 12-hour time
        const { startTime12Hour, endTime12Hour } = convertTo12HourFormat(currentShift.startTime, currentShift.endTime);

        res.status(200).json({
            success: true,
            data: {
                ...currentShift._doc ? currentShift._doc : currentShift,
                startTime: startTime12Hour,
                endTime: endTime12Hour
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get employees in current shift
// @route   GET /api/shifts/current/employees
// @access  Private
exports.getCurrentShiftEmployees = async (req, res) => {
    try {
        // Get current shift
        const currentHour = new Date().getHours();
        let shiftCode;
        
        if (currentHour >= 9 && currentHour < 17) {
            shiftCode = 'shift1';
        } else if (currentHour >= 17 || currentHour < 1) {
            shiftCode = 'shift2';
        } else {
            shiftCode = 'shift3';
        }
        
        // Get employees in this shift
        const employees = await Employee.find({
            $or: [
                { shift: shiftCode },
                { shift: 'flexible' }
            ],
            status: 'active'
        });
        
        res.status(200).json({
            success: true,
            count: employees.length,
            shift: shiftCode,
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

// @desc    Initialize default shifts
// @route   POST /api/shifts/initialize
// @access  Private/Admin
exports.initializeShifts = async (req, res) => {
    try {
        // Check if shifts already exist
        const existingShifts = await Shift.countDocuments();
        if (existingShifts > 0) {
            return res.status(400).json({
                success: false,
                message: 'Shifts already initialized'
            });
        }

        const defaultShifts = [
            {
                name: 'Shift 1',
                code: 'shift1',
                startTime: '09:00',
                endTime: '17:00',
                description: 'Morning Shift (9 AM to 5 PM)',
                color: '#3b82f6'
            },
            {
                name: 'Shift 2',
                code: 'shift2',
                startTime: '17:00',
                endTime: '01:00',
                description: 'Evening Shift (5 PM to 1 AM)',
                color: '#f59e0b'
            },
            {
                name: 'Shift 3',
                code: 'shift3',
                startTime: '01:00',
                endTime: '09:00',
                description: 'Night Shift (1 AM to 9 AM)',
                color: '#64748b'
            }
        ];

        await Shift.insertMany(defaultShifts);

        res.status(201).json({
            success: true,
            message: 'Default shifts initialized successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};