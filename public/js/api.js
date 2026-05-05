/**
 * api.js — Shared frontend utility for all API calls.
 * Include this script on every page that needs auth.
 *
 * Usage:
 *   authGuard('student')  — call at top of student pages
 *   authGuard('admin')    — call at top of admin pages
 *   apiCall('GET', '/api/announcements')
 *   apiCall('POST', '/api/complaints', { hostel, block, room, category, description })
 *   handleLogout()
 */

// ─── Token helpers ───────────────────────────────────────────
function getToken() {
    return localStorage.getItem('hh_token');
}

function getUser() {
    const u = localStorage.getItem('hh_user');
    return u ? JSON.parse(u) : null;
}

function setSession(token, user) {
    localStorage.setItem('hh_token', token);
    localStorage.setItem('hh_user', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
}

// ─── Auth guard ───────────────────────────────────────────────
/**
 * Call at the top of every protected page.
 * Redirects to /login if no token or wrong role.
 */
function authGuard(requiredRole) {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.href = '/login';
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        window.location.href = '/login';
        return null;
    }

    return user;
}

// ─── API call wrapper ─────────────────────────────────────────
/**
 * Makes an authenticated API request.
 * @param {string} method  - HTTP method
 * @param {string} path    - API path e.g. '/api/complaints'
 * @param {object} body    - Optional request body
 * @returns {Promise<any>} - Parsed JSON response
 */
async function apiCall(method, path, body = null) {
    const token = getToken();
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);

    // If 401, clear session and redirect
    if (res.status === 401) {
        clearSession();
        window.location.href = '/login';
        return null;
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ─── Logout ───────────────────────────────────────────────────
function handleLogout() {
    clearSession();
    window.location.href = '/login';
}

// ─── Date formatting helper ───────────────────────────────────
function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}
