// login.js — API-based authentication with role-scoped session handling

// ─── Already logged in? Redirect immediately ──────────────────
(function redirectIfLoggedIn() {
    // isTokenExpired is defined in api.js (loaded before this file)
    const adminToken  = localStorage.getItem('hh_admin_token');
    const studentToken = localStorage.getItem('hh_student_token');

    try {
        if (adminToken && !isTokenExpired(adminToken)) {
            window.location.replace('/admin/dashboard');
            return;
        }
        if (studentToken && !isTokenExpired(studentToken)) {
            window.location.replace('/student/home');
            return;
        }
    } catch (_) {
        // api.js not yet loaded in edge case — skip guard
    }
})();

// ─── Role Toggle ───────────────────────────────────────────────
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('selectedRole').value = btn.dataset.role;

        const usernameInput = document.getElementById('username');
        if (btn.dataset.role === 'student') {
            usernameInput.placeholder = 'Enter student ID (e.g. 24BCAN0745)';
        } else {
            usernameInput.placeholder = 'Enter admin username (e.g. admin13)';
        }
    });
});

// ─── Login form submit ─────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role     = document.getElementById('selectedRole').value;
    const errEl    = document.getElementById('formError');
    const btn      = document.getElementById('signInBtn');

    errEl.textContent = '';
    errEl.style.display = 'none';

    if (!username || !password) {
        errEl.textContent = 'Please enter username and password.';
        errEl.style.display = 'block';
        return;
    }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
        const data = await apiCall('POST', '/api/auth/login', { username, password, role });

        if (data && data.token) {
            // setSession uses role-scoped keys — no cross-portal bleed
            setSession(data.token, data.user);

            // Use replace() so back-button doesn't land back on login
            const redirect = data.user.role === 'admin' ? '/admin/dashboard' : '/student/home';
            window.location.replace(redirect);
        }
    } catch (error) {
        errEl.textContent = error.message || 'Invalid username or password.';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
});