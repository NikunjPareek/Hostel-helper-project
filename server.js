require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

const app = express();
const PORT = env.PORT;

function corsOptions(reqOrigin, callback) {
    if (!reqOrigin) return callback(null, true);

    const allowedOrigins = new Set(env.CORS_ORIGINS);
    if (!env.isProduction && allowedOrigins.size === 0) {
        return callback(null, true);
    }

    return callback(null, allowedOrigins.has(reqOrigin));
}

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
app.use(cors({ origin: corsOptions, credentials: true }));
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

app.get('/api/public-config', (req, res) => {
    res.json(env.PUBLIC_CONFIG);
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

// API routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/complaints', require('./src/routes/complaints'));
app.use('/api/announcements', require('./src/routes/announcements'));
app.use('/api/polls', require('./src/routes/polls'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/media', require('./src/routes/media'));

// Clean URL routing - serves static HTML pages.
// Guard: skip requests that look like static asset files (.js, .css, .png, etc.)
// so they get a proper 404 instead of being mapped to a folder/index.html.
const STATIC_EXT = /\.([a-z0-9]{1,6})$/i;

app.get('/:page', (req, res, next) => {
    if (STATIC_EXT.test(req.params.page)) return next();
    const file = path.join(__dirname, 'public', req.params.page, 'index.html');
    res.sendFile(file, err => {
        if (err) res.status(404).send('Page not found');
    });
});

app.get('/:section/:page', (req, res, next) => {
    if (STATIC_EXT.test(req.params.section) || STATIC_EXT.test(req.params.page)) return next();
    const file = path.join(__dirname, 'public', req.params.section, req.params.page, 'index.html');
    res.sendFile(file, err => {
        if (err) res.status(404).send('Page not found');
    });
});

// Catch-all for unmatched requests.
app.use((req, res) => {
    res.status(404).send('Not found');
});

async function startServer() {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\nPort ${PORT} is already in use.`);
            console.error('Stop the existing server first, then run npm start again.\n');
        } else {
            console.error(env.isProduction ? 'Server error' : err);
        }
        process.exit(1);
    });
}

if (require.main === module) {
    startServer().catch(error => {
        console.error(env.isProduction ? 'Failed to start server' : error);
        process.exit(1);
    });
}

module.exports = app;
