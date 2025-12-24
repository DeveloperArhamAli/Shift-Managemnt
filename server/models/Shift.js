const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add shift name'],
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        enum: ['shift1', 'shift2', 'shift3', 'shift4']
    },
    startTime: {
        type: String,
        required: [true, 'Please add start time'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please add valid time (HH:MM)']
    },
    endTime: {
        type: String,
        required: [true, 'Please add end time'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please add valid time (HH:MM)']
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Shift', ShiftSchema);