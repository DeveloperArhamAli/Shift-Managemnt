const mongoose = require('mongoose');
const Shift = require('./models/Shift');

const defaultShifts = [
    {
        name: 'Shift 1',
        code: 'shift1',
        startTime: '09:00',
        endTime: '17:00',
        description: 'Morning Shift (9 AM to 5 PM)',
        color: '#3b82f6',
        isActive: true
    },
    {
        name: 'Shift 2',
        code: 'shift2',
        startTime: '17:00',
        endTime: '01:00',
        description: 'Evening Shift (5 PM to 1 AM)',
        color: '#f59e0b',
        isActive: true
    },
    {
        name: 'Shift 3',
        code: 'shift3',
        startTime: '01:00',
        endTime: '09:00',
        description: 'Night Shift (1 AM to 9 AM)',
        color: '#64748b',
        isActive: true
    }
];

const initShifts = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/shift-management');
        console.log('Connected to MongoDB');
        
        // Clear existing shifts
        await Shift.deleteMany({});
        console.log('Cleared existing shifts');
        
        // Insert default shifts
        await Shift.insertMany(defaultShifts);
        console.log('✅ Default shifts created successfully!');
        console.log('1. Shift 1: 9:00 - 17:00');
        console.log('2. Shift 2: 17:00 - 1:00');
        console.log('3. Shift 3: 1:00 - 9:00');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

initShifts();