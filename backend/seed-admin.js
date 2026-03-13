// Script สร้างแอดมินคนแรก
// ใช้: node seed-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin1234';
const ADMIN_DISPLAY_NAME = 'ผู้ดูแลระบบ';

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existing = await User.findOne({ username: ADMIN_USERNAME });
        if (existing) {
            console.log('⚠️ Admin user already exists!');
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log('✅ Updated existing user role to admin');
            }
            process.exit(0);
        }

        // Create admin
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const admin = new User({
            username: ADMIN_USERNAME,
            password: hashedPassword,
            displayName: ADMIN_DISPLAY_NAME,
            characterId: 1,
            characterImage: '1.png',
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log(`  Username: ${ADMIN_USERNAME}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log('  ⚠️ Please change the password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedAdmin();
