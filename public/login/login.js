// login.js — API-based authentication

// ─── Role Toggle ───────────────────────────────────────────────
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('selectedRole').value = btn.dataset.role;
        
        // Update placeholder hint
        const usernameInput = document.getElementById('username');
        if (btn.dataset.role === 'student') {
            usernameInput.placeholder = 'Enter student ID (e.g. 24BCAN0745)';
        } else {
            usernameInput.placeholder = 'Enter admin username (e.g. admin13)';
        }
    });
});

// ─── Login form submit ─────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('selectedRole').value;
    const errEl = document.getElementById('formError');
    const btn = document.getElementById('signInBtn');

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
            setSession(data.token, data.user);

            if (data.user.role === 'admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/student/home';
            }
        }
    } catch (error) {
        errEl.textContent = error.message || 'Invalid username or password.';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
});

// ─── Auto-redirect if already logged in ───────────────────────
window.addEventListener('DOMContentLoaded', function() {
    const token = getToken();
    const user = getUser();

    if (token && user) {
        if (user.role === 'admin') {
            window.location.href = '/admin/dashboard';
        } else {
            window.location.href = '/student/home';
        }
    }
});