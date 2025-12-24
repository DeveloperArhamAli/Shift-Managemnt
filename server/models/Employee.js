const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return 'EMP' + Math.floor(1000 + Math.random() * 9000);
        }
    },
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
        validate: {
            validator: function(value) {
                if (this.isNew) {
                    return value && value.length >= 6;
                }
                if (this.isModified('password')) {
                    return value && value.length >= 6;
                }
                return true;
            },
            message: 'Please add a password with at least 6 characters'
        }
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    shift: {
        type: String,
        enum: ['shift1', 'shift2', 'shift3', 'flexible'],
        default: 'shift1'
    },
    customTiming: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' }
    },
    weeklyOff: [{
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    todayStatus: {
        type: String,
        enum: ['present', 'absent', 'on_leave', 'weekly_off'],
        default: 'present'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
EmployeeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);