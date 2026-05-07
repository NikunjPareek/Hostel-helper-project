/**
 * api.js — Shared frontend utility for all portals.
 *
 * Features:
 *  - Role-scoped localStorage (hh_admin_* / hh_student_*) — prevents cross-session bleed
 *  - Client-side JWT expiry check — auto-logout on expired tokens
 *  - Strict authGuard — wrong role → correct portal (no login loop)
 *  - refreshProfile() — syncs hh_user from server on page load
 *  - apiCall() — authenticated fetch wrapper with 401 auto-logout
 *  - handleLogout() — wipes both role namespaces
 */

// ─── Role key helpers ─────────────────────────────────────────
function _portalRole() {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'student';
}

function _key(role, field) {
    return `hh_${role}_${field}`;
}

// ─── Token expiry check ───────────────────────────────────────
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Add 10s buffer to avoid edge-case race conditions
        return Date.now() >= (payload.exp * 1000) - 10000;
    } catch (_) {
        return true;
    }
}

// ─── Session helpers ──────────────────────────────────────────
function getToken() {
    return localStorage.getItem(_key(_portalRole(), 'token'));
}

function getUser() {
    const raw = localStorage.getItem(_key(_portalRole(), 'user'));
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

function setSession(token, user) {
    const role = user.role === 'admin' ? 'admin' : 'student';
    localStorage.setItem(_key(role, 'token'), token);
    localStorage.setItem(_key(role, 'user'), JSON.stringify(user));
}

function clearSession() {
    // Wipe BOTH role namespaces — guarantees clean state on shared devices
    ['admin', 'student'].forEach(role => {
        localStorage.removeItem(_key(role, 'token'));
        localStorage.removeItem(_key(role, 'user'));
    });
}

// ─── Auth guard ───────────────────────────────────────────────
/**
 * Call at the top of every protected page.
 * - Expired/missing token → clearSession + redirect to /login
 * - Wrong role → redirect to correct portal (NOT /login — avoids loop)
 */
function authGuard(requiredRole) {
    const token = getToken();
    const user = getUser();
    const isLoginPage = window.location.pathname.startsWith('/login');

    if (!token || !user || isTokenExpired(token)) {
        clearSession();
        if (!isLoginPage) window.location.replace('/login');
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        // Send to their actual portal, not the login page
        const correctPortal = user.role === 'admin' ? '/admin/dashboard' : '/student/home';
        window.location.replace(correctPortal);
        return null;
    }

    return user;
}

// ─── API call wrapper ─────────────────────────────────────────
/**
 * Makes an authenticated API request.
 * @param {string} method  - HTTP method
 * @param {string} path    - API path e.g. '/api/complaints'
 * @param {object} [body]  - Optional request body
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

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);

    // 401 → session invalid, clear and go to login
    if (res.status === 401) {
        clearSession();
        window.location.replace('/login');
        return null;
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ─── Profile refresh ──────────────────────────────────────────
/**
 * Syncs the full profile from /api/users/me into localStorage.
 * Call on every student page load after authGuard.
 */
async function refreshProfile() {
    try {
        const profile = await apiCall('GET', '/api/users/me');
        if (profile) {
            const existing = getUser() || {};
            setSession(getToken(), { ...existing, ...profile });
        }
    } catch (_) {
        // Non-fatal — profile panel will show cached data
    }
}

// ─── Logout ───────────────────────────────────────────────────
function handleLogout() {
    clearSession();
    window.location.replace('/login');
}

// ─── Date formatting helper ───────────────────────────────────
function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' at '
        + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
