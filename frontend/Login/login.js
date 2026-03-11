document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  var user = document.getElementById("username").value.trim();
  var pass = document.getElementById("password").value.trim();
  var err  = document.getElementById("formError");
  err.textContent = "";
  if (user === "admin" && pass === "admin123") {
    localStorage.setItem("loggedInAs", "admin");
    window.location.href = "../Admin/dashboard.html";
    return;
  }

  if (user === "student" && pass === "student123") {
    localStorage.setItem("loggedInAs", "student");
    window.location.href = "../Student/home.html";
    return;
  }

  err.textContent = "Invalid username or password.";
  err.style.display = "block";
});
if (localStorage.getItem("loggedInAs") === "admin") {
  window.location.href = "../Admin/dashboard.html";
}
if (localStorage.getItem("loggedInAs") === "student") {
  window.location.href = "../Student/home.html";
}
