function loadAdminHeader() {
  var el = document.getElementById("header");
  if (!el) return;
  fetch("header.html")
    .then(function(r){ return r.text(); })
    .then(function(html){
      el.innerHTML = html;
      setActiveNavLink();
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
  window.location.href = "login.html";
}
function checkAdminAuth() {
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "login.html";
  }
}
document.addEventListener("DOMContentLoaded", function(){
  checkAdminAuth();
  loadAdminHeader();
});
