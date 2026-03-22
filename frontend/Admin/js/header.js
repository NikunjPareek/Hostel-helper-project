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
      var menuContainer = document.getElementById("headerMenuContainer");
      if(toggleBtn && menuContainer) {
        toggleBtn.addEventListener('click', function() {
          menuContainer.classList.toggle('active');
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

function loadAdminFooter() {
  var footerHTML = `
<footer class="admin-footer">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-col">
        <h4 class="footer-heading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 
          System Status
        </h4>
        <p class="footer-text">All internal systems operational.</p>
        <p class="footer-text">Version 2.4.1 (Build 8902)</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Admin Support</h4>
        <p class="footer-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> it-support@jecrc.edu.in</p>
        <p class="footer-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg> Ext: 4021</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Resources</h4>
        <a href="#" class="footer-link">Admin Guidelines</a>
        <a href="#" class="footer-link">Security Policy</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 JECRC Hostel Administration. Internal Use Only.</p>
    </div>
  </div>
</footer>
  `;
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}

document.addEventListener("DOMContentLoaded", function(){
  checkAdminAuth();
  loadAdminHeader();
  loadAdminFooter();
});