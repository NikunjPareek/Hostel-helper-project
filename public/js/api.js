/**
 * Shared frontend utility for both portals.
 * Keeps role-scoped UI state in localStorage while server auth uses httpOnly cookies.
 */

function _portalRole() {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'student';
}

function _key(role, field) {
    return `hh_${role}_${field}`;
}

function getSessionExpiresAt(role = _portalRole()) {
    return localStorage.getItem(_key(role, 'expires_at'));
}

function isSessionExpired(role = _portalRole()) {
    const expiresAt = getSessionExpiresAt(role);
    return !expiresAt || Date.now() >= Date.parse(expiresAt) - 10000;
}

function getUser() {
    const raw = localStorage.getItem(_key(_portalRole(), 'user'));
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

function setSession(expiresAt, user) {
    const role = user.role === 'admin' ? 'admin' : 'student';
    let sessionExpiresAt = expiresAt;
    if (!sessionExpiresAt) {
        sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    localStorage.setItem(_key(role, 'expires_at'), sessionExpiresAt);
    localStorage.setItem(_key(role, 'user'), JSON.stringify(user));
}

function clearSession() {
    ['admin', 'student'].forEach(role => {
        localStorage.removeItem(_key(role, 'expires_at'));
        localStorage.removeItem(_key(role, 'user'));
    });
}

async function authGuard(requiredRole) {
    const isLoginPage = window.location.pathname.startsWith('/login');

    try {
        const res = await fetch('/api/users/me', { credentials: 'include' });

        if (res.status === 401) {
            clearSession();
            if (!isLoginPage) window.location.replace('/login');
            return null;
        }

        if (!res.ok) {
            throw new Error('Session check failed');
        }

        const user = await res.json();
        const userRole = user.role === 'admin' ? 'admin' : 'student';
        setSession(getSessionExpiresAt(userRole), user);

        if (requiredRole && user.role !== requiredRole) {
            const correctPortal = user.role === 'admin' ? '/admin/dashboard' : '/student/home';
            window.location.replace(correctPortal);
            return null;
        }

        return user;
    } catch (_) {
        clearSession();
        if (!isLoginPage) window.location.replace('/login');
        return null;
    }
}

async function apiCall(method, path, body = null) {
    const options = {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);

    if (res.status === 401) {
        const isLoginPage = window.location.pathname.startsWith('/login');
        const isLoginCall = path === '/api/auth/login';
        if (!isLoginPage && !isLoginCall) {
            clearSession();
            window.location.replace('/login');
            return null;
        }
    }

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
        throw new Error((data && data.error) || 'Request failed');
    }

    return data;
}

async function refreshProfile() {
    try {
        const profile = await apiCall('GET', '/api/users/me');
        if (profile) {
            const existing = getUser() || {};
            setSession(getSessionExpiresAt(), { ...existing, ...profile });
        }
    } catch (_) {
        // Non-fatal: existing cached profile can still render the page shell.
    }
}

function handleLogout() {
    clearSession();
    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive: true
    }).finally(() => {
        window.location.replace('/login');
    });
}

function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function formatDateTime(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' at '
        + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const PUBLIC_CONFIG_FALLBACK = {
    contactAddress: 'Example Campus Address',
    contactPhone: '+1 555 010 0000',
    contactEmail: 'support@example.edu'
};
let publicConfigPromise = null;

function getPublicConfig() {
    if (!publicConfigPromise) {
        publicConfigPromise = fetch('/api/public-config', { credentials: 'include' })
            .then(res => res.ok ? res.json() : PUBLIC_CONFIG_FALLBACK)
            .catch(() => PUBLIC_CONFIG_FALLBACK);
    }
    return publicConfigPromise;
}

async function applyPublicConfig(root = document) {
    const config = await getPublicConfig();
    const scope = root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-public-config]').forEach(node => {
        const key = node.getAttribute('data-public-config');
        if (config[key] && node.textContent !== config[key]) node.textContent = config[key];
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyPublicConfig();
    const observer = new MutationObserver(() => applyPublicConfig());
    observer.observe(document.body, { childList: true, subtree: true });
});

// Global mobile navigation handler for dynamically injected headers.
document.addEventListener('click', function (e) {
    const toggleBtn = e.target.closest('.mobile-toggle');
    if (toggleBtn) {
        const nav = document.querySelector('.header-nav');
        const backdrop = document.querySelector('.nav-backdrop');
        if (nav) {
            const isActive = nav.classList.toggle('active');
            toggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            if (backdrop) backdrop.classList.toggle('active', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        }
        return;
    }

    if (e.target.closest('.nav-backdrop') || e.target.closest('.nav-link')) {
        const nav = document.querySelector('.header-nav');
        const backdrop = document.querySelector('.nav-backdrop');
        const toggleBtn = document.querySelector('.mobile-toggle');

        if (nav && nav.classList.contains('active')) {
            if (!e.target.closest('.nav-link') || window.innerWidth <= 1024) {
                nav.classList.remove('active');
                if (backdrop) backdrop.classList.remove('active');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        }
    }
});
