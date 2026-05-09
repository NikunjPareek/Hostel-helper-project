const PLACEHOLDER_VALUES = new Set([
    'replace_with_a_random_64_character_secret',
    'change_me',
    'changeme',
    'your_jwt_secret'
]);

function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function required(name) {
    const value = clean(process.env[name]);
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function parseOrigins(value) {
    return clean(value)
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}

function parseDurationToMs(value) {
    const match = clean(value).match(/^(\d+)(ms|s|m|h|d)?$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = (match[2] || 'ms').toLowerCase();
    const multipliers = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

const NODE_ENV = clean(process.env.NODE_ENV) || 'development';
const isProduction = NODE_ENV === 'production';
const JWT_SECRET = required('JWT_SECRET');
const JWT_EXPIRES_IN = clean(process.env.JWT_EXPIRES_IN) || '7d';
const sessionMaxAgeMs = parseDurationToMs(JWT_EXPIRES_IN) || (7 * 24 * 60 * 60 * 1000);

if (JWT_SECRET.length < 32) {
    const message = 'JWT_SECRET should be at least 32 characters long.';
    if (isProduction) {
        throw new Error(message);
    }
    console.warn(`Warning: ${message}`);
}

if (isProduction && PLACEHOLDER_VALUES.has(JWT_SECRET.toLowerCase())) {
    throw new Error('JWT_SECRET is still set to a placeholder value.');
}

module.exports = {
    NODE_ENV,
    isProduction,
    PORT: clean(process.env.PORT) || '3000',
    MONGO_URI: required('MONGO_URI'),
    JWT_SECRET,
    JWT_EXPIRES_IN,
    SESSION_COOKIE_NAME: clean(process.env.SESSION_COOKIE_NAME) || 'hh_session',
    SESSION_MAX_AGE_MS: sessionMaxAgeMs,
    CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || ''),
    PUBLIC_CONFIG: {
        contactAddress: clean(process.env.PUBLIC_CONTACT_ADDRESS) || 'Example Campus Address',
        contactPhone: clean(process.env.PUBLIC_CONTACT_PHONE) || '+1 555 010 0000',
        contactEmail: clean(process.env.PUBLIC_CONTACT_EMAIL) || 'support@example.edu'
    }
};
