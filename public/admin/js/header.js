// Admin header.js

function loadAdminHeader() {
  var el = document.getElementById("header");
  if (!el) return;
  fetch("header.html")
    .then(function(r){ return r.text(); })
    .then(function(html){
      el.innerHTML = html;
      setActiveNavLink();
      
      var toggleBtn = document.getElementById("mobileToggle");
      var nav = document.getElementById("headerNav");
      if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var isOpen = nav.classList.toggle('active');
          toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Close when clicking outside the header
        document.addEventListener('click', function(e) {
          if (!el.contains(e.target)) {
            nav.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
}

function setActiveNavLink() {
  var page = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll("#header .nav-link").forEach(function(a){
    var pg = (a.getAttribute("data-page")||"").toLowerCase();
    if (pg === page.toLowerCase()) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function handleLogout() {
  localStorage.removeItem("adminLoggedIn");
  localStorage.removeItem("loggedInAs");
  window.location.href = "../Login/login.html";
}

function checkAdminAuth() {
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "../Login/login.html";
  }
}

document.addEventListener("DOMContentLoaded", function(){
  checkAdminAuth();
  loadAdminHeader();
});