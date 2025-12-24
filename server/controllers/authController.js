const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// @desc    Register employee
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if employee exists
        let employee = await Employee.findOne({ email });
        if (employee) {
            return res.status(400).json({
                success: false,
                message: 'Employee already exists'
            });
        }

        // Create employee
        employee = await Employee.create({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            phone,
            role: role || 'employee'
        });

        // Create token
        const token = jwt.sign(
            { id: employee._id, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role
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

// @desc    Login employee
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    console.log("req received")
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for employee
        const employee = await Employee.findOne({ email }).select('+password');
        if (!employee) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if employee is active
        if (employee.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: employee._id, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                shift: employee.shift,
                weeklyOff: employee.weeklyOff
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

// @desc    Get current logged in employee
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.id);
        res.status(200).json({
            success: true,
            employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update employee details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone
        };

        const employee = await Employee.findByIdAndUpdate(
            req.user.id, 
            fieldsToUpdate, 
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            employee
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};