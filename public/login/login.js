// API-based authentication with role-scoped session handling.

(function redirectIfLoggedIn() {
    const adminUser = localStorage.getItem('hh_admin_user');
    const studentUser = localStorage.getItem('hh_student_user');
    const adminExpiresAt = localStorage.getItem('hh_admin_expires_at');
    const studentExpiresAt = localStorage.getItem('hh_student_expires_at');

    if (adminUser && adminExpiresAt && Date.now() < Date.parse(adminExpiresAt) - 10000) {
        window.location.replace('/admin/dashboard');
        return;
    }
    if (studentUser && studentExpiresAt && Date.now() < Date.parse(studentExpiresAt) - 10000) {
        window.location.replace('/student/home');
    }
})();

document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('selectedRole').value = btn.dataset.role;

        const usernameInput = document.getElementById('username');
        if (btn.dataset.role === 'student') {
            usernameInput.placeholder = 'Enter student ID (e.g. demo-student-001)';
        } else {
            usernameInput.placeholder = 'Enter admin username (e.g. demo-admin)';
        }
    });
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
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

        if (data && data.user) {
            setSession(data.expiresAt, data.user);
            await apiCall('GET', '/api/users/me');
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
