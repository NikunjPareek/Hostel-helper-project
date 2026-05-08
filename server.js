require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: false, limit: '60mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

async function ensureDatabase(req, res, next) {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
}

app.use('/api', ensureDatabase);

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/complaints', require('./src/routes/complaints'));
app.use('/api/announcements', require('./src/routes/announcements'));
app.use('/api/polls', require('./src/routes/polls'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/media', require('./src/routes/media'));

// Clean URL routing — serves static HTML pages
app.get('/:page', (req, res) => {
    const file = path.join(__dirname, 'public', req.params.page, 'index.html');
    res.sendFile(file);
});

app.get('/:section/:page', (req, res) => {
    const file = path.join(__dirname, 'public', req.params.section, req.params.page, 'index.html');
    res.sendFile(file);
});

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = app;
