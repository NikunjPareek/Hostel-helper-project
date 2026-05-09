// Admin header.js

function loadAdminHeader() {
  var el = document.getElementById("header");
  if (!el) return;
  fetch("/admin/header.html")
    .then(function(r){ return r.text(); })
    .then(function(html){
      el.innerHTML = html;
      setActiveNavLink();
      
      var toggleBtn = document.getElementById("mobileToggle");
      var nav = document.getElementById("headerNav");
      var backdrop = document.getElementById("navBackdrop");
      if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var isOpen = nav.classList.toggle('active');
          if (backdrop) backdrop.classList.toggle('active', isOpen);
          toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Close when clicking outside the header (e.g. on the backdrop)
        document.addEventListener('click', function(e) {
          if (!el.contains(e.target)) {
            nav.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
}

function setActiveNavLink() {
  // Get the last non-empty segment of the path (e.g. /admin/dashboard -> "dashboard")
  var segments = window.location.pathname.split("/").filter(Boolean);
  var page = segments[segments.length - 1] || "dashboard";
  document.querySelectorAll("#header .nav-link").forEach(function(a){
    var pg = (a.getAttribute("data-page")||"").toLowerCase();
    if (pg === page.toLowerCase()) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function handleAdminLogout() {
  // Delegates to shared handleLogout() from api.js
  if (typeof handleLogout === 'function') {
    handleLogout();
  } else {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    window.location.href = '/login';
  }
}

function checkAdminAuth() {
  // Auth now handled by authGuard() in api.js on each page
  // Keep this as no-op for backward compatibility
}

document.addEventListener("DOMContentLoaded", function(){
  // Auth is handled by authGuard() in api.js
  loadAdminHeader();
});