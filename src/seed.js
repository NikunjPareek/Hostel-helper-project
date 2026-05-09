/**
 * Seed script — run once to populate MongoDB with initial data.
 * Usage: node src/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Announcement = require('./models/Announcement');
const Poll = require('./models/Poll');
const PollResponse = require('./models/PollResponse');
const UploadedMedia = require('./models/UploadedMedia');
const Complaint = require('./models/Complaint');
const AnonymousFeedback = require('./models/AnonymousFeedback');

const students = [
    {
        username: '24BCAN0745', password: 'Student@745', name: 'Nikunj Pareek',
        role: 'student', studentId: '24BCAN0745', hostelType: 'Boys Hostel',
        block: 'A', room: 'A-201'
    },
    {
        username: '24BCAN0062', password: 'Student@062', name: 'Ayush Joshi',
        role: 'student', studentId: '24BCAN0062', hostelType: 'Boys Hostel',
        block: 'B', room: 'B-105'
    },
    {
        username: '24BCAN0187', password: 'Student@187', name: 'Harshwardhan Sharma',
        role: 'student', studentId: '24BCAN0187', hostelType: 'Boys Hostel',
        block: 'A', room: 'A-314'
    },
    {
        username: '24BCAN0541', password: 'Student@541', name: 'Divyanshu Tailor',
        role: 'student', studentId: '24BCAN0541', hostelType: 'Boys Hostel',
        block: 'C', room: 'C-102'
    },
    {
        username: '24BCAN0644', password: 'Student@644', name: 'Jatin Yadav',
        role: 'student', studentId: '24BCAN0644', hostelType: 'Boys Hostel',
        block: 'B', room: 'B-207'
    },
    {
        username: '24BCAN0001', password: 'Student@001', name: 'Riya Sharma',
        role: 'student', studentId: '24BCAN0001', hostelType: 'Girls Hostel',
        block: 'G', room: 'G-110'
    }
];

const admins = [
    { username: 'admin12', password: 'Admin@Riya', name: 'Riya Sharma', role: 'admin' },
    { username: 'admin13', password: 'Admin@Nikunj', name: 'Nikunj Pareek', role: 'admin' },
    { username: 'admin14', password: 'Admin@Harsh', name: 'Harshwardhan Sharma', role: 'admin' },
    { username: 'admin15', password: 'Admin@Ayush', name: 'Ayush Joshi', role: 'admin' },
    { username: 'admin16', password: 'Admin@Jatin', name: 'Jatin Yadav', role: 'admin' },
    { username: 'admin17', password: 'Admin@Dev', name: 'Devyanshu Tailor', role: 'admin' }
];

const sampleAnnouncements = [
    {
        title: 'Mess Menu Updated',
        description: 'The mess menu has been updated in accordance with the feedback received from students.',
        createdBy: 'Admin'
    },
    {
        title: 'Water Supply Maintenance',
        description: 'There will be a water supply maintenance on 15th February from 10:00 AM to 2:00 PM.',
        createdBy: 'Admin'
    },
    {
        title: 'WiFi Upgrade',
        description: 'The hostel WiFi network is being upgraded to provide better connectivity. Expect brief outages.',
        createdBy: 'Admin'
    },
    {
        title: 'Hostel Inspection Notice',
        description: 'A routine hostel inspection will be conducted. Please ensure rooms are tidy and comply with hostel rules.',
        createdBy: 'Admin'
    }
];

const samplePoll = {
    question: 'How would you rate the current mess food quality?',
    options: [
        { label: 'Excellent', votes: 0 },
        { label: 'Good', votes: 0 },
        { label: 'Average', votes: 0 },
        { label: 'Poor', votes: 0 }
    ],
    createdBy: 'Admin',
    isActive: true
};

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany({});
        await Student.deleteMany({});
        await Admin.deleteMany({});
        await Announcement.deleteMany({});
        await Poll.deleteMany({});
        await PollResponse.deleteMany({});
        await UploadedMedia.deleteMany({});
        await Complaint.deleteMany({});
        await AnonymousFeedback.deleteMany({});
        console.log('Cleared existing data');

        // Insert accounts with create() so password hashing hooks run.
        for (const student of students) {
            await Student.create(student);
        }
        for (const admin of admins) {
            await Admin.create(admin);
        }
        console.log(`Seeded ${students.length} students + ${admins.length} admins`);

        // Insert announcements
        await Announcement.insertMany(sampleAnnouncements);
        console.log(`Seeded ${sampleAnnouncements.length} announcements`);

        // Insert poll
        await Poll.create(samplePoll);
        console.log('Seeded 1 active poll');

        console.log('\n✅ Seed complete!');
        console.log('\nStudent logins:');
        students.forEach(s => console.log(`  ${s.username} / ${s.password}`));
        console.log('\nAdmin logins:');
        admins.forEach(a => console.log(`  ${a.username} / ${a.password}`));

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
