const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        default: 'student',
        immutable: true
    },
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    hostelType: {
        type: String,
        default: null
    },
    block: {
        type: String,
        default: null
    },
    room: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'students'
});

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
