require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/complaints', require('./src/routes/complaints'));
app.use('/api/announcements', require('./src/routes/announcements'));
app.use('/api/polls', require('./src/routes/polls'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Clean URL routing — serves static HTML pages
app.get('/:page', (req, res) => {
    const file = path.join(__dirname, 'public', req.params.page, 'index.html');
    res.sendFile(file);
});

app.get('/:section/:page', (req, res) => {
    const file = path.join(__dirname, 'public', req.params.section, req.params.page, 'index.html');
    res.sendFile(file);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
