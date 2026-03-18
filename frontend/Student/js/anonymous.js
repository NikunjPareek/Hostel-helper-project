// Authentication check
function checkStudentAuth() {
  if (localStorage.getItem("studentLoggedIn") !== "true") {
    window.location.href = "../Login/login.html";
  }
}

function setActiveNavLink() {
  const path = window.location.pathname.split("/").pop();
  const currentPage = (path || "home.html").toLowerCase();
  const navLinks = document.querySelectorAll("#header .nav_link");

  navLinks.forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    const isActive = href === currentPage;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Check auth on page load
document.addEventListener("DOMContentLoaded", function() {
  checkStudentAuth();
});

// Load header
fetch("header.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("header").innerHTML = data;
    setActiveNavLink();
  });

// Load footer
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;
  });