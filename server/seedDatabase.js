const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Adjust this path to your actual Employee model location
const Employee = require('./models/Employee');

const demoUsers = [
    {
        name: 'Admin User',
        email: 'admin@shift.com',
        password: 'password123',
        phone: '1234567890',
        role: 'admin',
        shift: 'shift1',
        employeeId: 'ADMIN001'
    },
    {
        name: 'Employee User',
        email: 'employee@shift.com',
        password: 'password123',
        phone: '0987654321',
        role: 'employee',
        shift: 'shift1',
        employeeId: 'EMP001'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to your database (UPDATE THIS CONNECTION STRING)
        await mongoose.connect('mongodb://127.0.0.1:27017/shift-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB.');

        // Clear existing demo users to avoid duplicates
        await Employee.deleteMany({
            email: { $in: demoUsers.map(user => user.email) }
        });
        console.log('🗑️  Cleared old demo users.');

        // Hash passwords and create users
        for (const userData of demoUsers) {
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);
            await Employee.create(userData);
            console.log(`👤 Created user: ${userData.email}`);
        }

        console.log('\n🎉 Database seeding completed!');
        console.log('You can now log in with:');
        console.log('   Admin:    admin@shift.com / password123');
        console.log('   Employee: employee@shift.com / password123');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();