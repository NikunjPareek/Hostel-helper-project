function getStudentPageFromPath() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments[1] || 'home';
}

function setStudentActiveNavLink() {
    const currentPage = getStudentPageFromPath().toLowerCase();

    document.querySelectorAll('#studentHeaderNav .nav-link').forEach(link => {
        const page = (link.getAttribute('data-page') || '').toLowerCase();
        const isActive = page === currentPage;

        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function bindStudentMobileNav() {
    const toggle = document.getElementById('mobileToggle');
    const nav = document.getElementById('studentHeaderNav');
    const backdrop = document.getElementById('navBackdrop');
    if (!toggle || !nav) return;

    function closeDrawer() {
        nav.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function openDrawer() {
        nav.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', event => {
        event.stopPropagation();
        nav.classList.contains('active') ? closeDrawer() : openDrawer();
    });

    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) closeDrawer();
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeDrawer();
    });
}

function loadStudentHeader() {
    const header = document.getElementById('header');
    if (!header) return Promise.resolve();

    return fetch('/student/header.html')
        .then(response => response.text())
        .then(html => {
            header.innerHTML = html;
            setStudentActiveNavLink();
            bindStudentMobileNav();
        });
}
