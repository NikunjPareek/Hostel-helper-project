/* ===========================
   STUDENT HEADER JAVASCRIPT
=========================== */

/* ===========================
   AUTHENTICATION & LOGOUT
=========================== */

// Check if student is logged in
function checkStudentAuth() {
    const isLoggedIn = localStorage.getItem("studentLoggedIn");
    if (isLoggedIn !== "true") {
        // Redirect to login page if not authenticated
        window.location.href = "../Login/login.html";
    }
}

// Handle student logout
function handleStudentLogout() {
    // Confirm logout
    const confirmLogout = confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
        // Clear all student session data
        localStorage.removeItem("studentLoggedIn");
        localStorage.removeItem("loggedInAs");
        localStorage.removeItem("studentName");
        localStorage.removeItem("studentRoom");
        localStorage.removeItem("studentPhone");
        
        // Optional: Show logout message
        alert("You have been logged out successfully.");
        
        // Redirect to login page
        window.location.href = "../Login/login.html";
    }
}

/* ===========================
   LOAD STUDENT INFORMATION
=========================== */

function loadStudentInfo() {
    // Get student data from localStorage (demo data or real data)
    const studentData = {
        name: localStorage.getItem("studentName") || "Demo Student",
        room: localStorage.getItem("studentRoom") || "302",
        phone: localStorage.getItem("studentPhone") || "9876543210"
    };

    // Get initials from name
    const initials = studentData.name
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 2);

    // Update desktop student info
    const studentNameEl = document.getElementById("studentName");
    const studentRoomEl = document.getElementById("studentRoom");
    const studentInitialsEl = document.getElementById("studentInitials");

    if (studentNameEl) studentNameEl.textContent = studentData.name;
    if (studentRoomEl) studentRoomEl.textContent = `Room: ${studentData.room}`;
    if (studentInitialsEl) studentInitialsEl.textContent = initials;

    // Update mobile student info
    const mobileStudentNameEl = document.getElementById("mobileStudentName");
    const mobileStudentRoomEl = document.getElementById("mobileStudentRoom");
    const mobileStudentInitialsEl = document.getElementById("mobileStudentInitials");

    if (mobileStudentNameEl) mobileStudentNameEl.textContent = studentData.name;
    if (mobileStudentRoomEl) mobileStudentRoomEl.textContent = `Room: ${studentData.room}`;
    if (mobileStudentInitialsEl) mobileStudentInitialsEl.textContent = initials;
}

/* ===========================
   ACTIVE NAVIGATION LINK
=========================== */

function setActiveNavLink() {
    // Get current page name
    const path = window.location.pathname.split("/").pop();
    const currentPage = (path || "home.html").toLowerCase();

    // Select all navigation links (both desktop and mobile)
    const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");

    navLinks.forEach((link) => {
        const page = link.getAttribute("data-page");
        
        if (page && page.toLowerCase() === currentPage) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        }
    });
}

/* ===========================
   MOBILE MENU TOGGLE
=========================== */

function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const mobileNav = document.getElementById("mobileNav");
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

    if (!mobileMenuToggle || !mobileNav) return;

    // Toggle mobile menu
    mobileMenuToggle.addEventListener("click", function() {
        const isActive = mobileNav.classList.toggle("active");
        mobileMenuToggle.classList.toggle("active");
        
        // Update aria-expanded attribute
        mobileMenuToggle.setAttribute("aria-expanded", isActive);
        
        // Prevent body scroll when menu is open
        if (isActive) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    });

    // Close mobile menu when clicking on a link
    mobileNavLinks.forEach(link => {
        link.addEventListener("click", function() {
            mobileNav.classList.remove("active");
            mobileMenuToggle.classList.remove("active");
            mobileMenuToggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function(event) {
        const isClickInsideMenu = mobileNav.contains(event.target);
        const isClickOnToggle = mobileMenuToggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnToggle && mobileNav.classList.contains("active")) {
            mobileNav.classList.remove("active");
            mobileMenuToggle.classList.remove("active");
            mobileMenuToggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
        }
    });

    // Close mobile menu on escape key
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && mobileNav.classList.contains("active")) {
            mobileNav.classList.remove("active");
            mobileMenuToggle.classList.remove("active");
            mobileMenuToggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
        }
    });
}

/* ===========================
   INITIALIZE ON PAGE LOAD
=========================== */

document.addEventListener("DOMContentLoaded", function() {
    // Check authentication
    checkStudentAuth();
    
    // Load student information
    loadStudentInfo();
    
    // Set active navigation link
    setActiveNavLink();
    
    // Initialize mobile menu
    initializeMobileMenu();
});

/* ===========================
   WINDOW RESIZE HANDLER
=========================== */

// Close mobile menu on window resize (if screen becomes larger)
let resizeTimer;
window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (window.innerWidth >= 768) {
            const mobileNav = document.getElementById("mobileNav");
            const mobileMenuToggle = document.getElementById("mobileMenuToggle");
            
            if (mobileNav && mobileNav.classList.contains("active")) {
                mobileNav.classList.remove("active");
                mobileMenuToggle.classList.remove("active");
                mobileMenuToggle.setAttribute("aria-expanded", "false");
                document.body.style.overflow = "";
            }
        }
    }, 250);
});

/* ===========================
   EXPORT FOR USE IN OTHER FILES
=========================== */

// Make functions available globally
if (typeof window !== 'undefined') {
    window.handleStudentLogout = handleStudentLogout;
    window.checkStudentAuth = checkStudentAuth;
}
