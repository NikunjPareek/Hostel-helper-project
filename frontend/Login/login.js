// login.js

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  var user = document.getElementById("username").value.trim();
  var pass = document.getElementById("password").value.trim();
  var err = document.getElementById("formError");
  
  // Clear previous error
  err.textContent = "";
  err.style.display = "none";
  
  // Admin credentials: admin / admin@123
  if (user === "admin" && pass === "admin@123") {
    localStorage.setItem("loggedInAs", "admin");
    localStorage.setItem("adminLoggedIn", "true");
    window.location.href = "../Admin/dashboard.html";
    return;
  }

  // Student credentials: student / student@123
  if (user === "student" && pass === "student@123") {
    localStorage.setItem("loggedInAs", "student");
    localStorage.setItem("studentLoggedIn", "true");
    window.location.href = "../Student/home.html";
    return;
  }

  // Invalid credentials
  err.textContent = "Invalid username or password.";
  err.style.display = "block";
});

// Check if already logged in and redirect
window.addEventListener("DOMContentLoaded", function() {
  if (localStorage.getItem("adminLoggedIn") === "true") {
    window.location.href = "../Admin/dashboard.html";
  }
  if (localStorage.getItem("studentLoggedIn") === "true") {
    window.location.href = "../Student/home.html";
  }
});