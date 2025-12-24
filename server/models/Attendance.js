const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    shift: {
        type: String,
        required: true,
        enum: ['shift1', 'shift2', 'shift3']
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'half_day', 'on_leave'],
        default: 'present'
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    totalHours: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for employee and date
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);