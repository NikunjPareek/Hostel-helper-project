// Authentication check
function checkStudentAuth() {
  if (localStorage.getItem("studentLoggedIn") !== "true") {
    window.location.href = "../Login/login.html";
  }
}

// Check auth on page load
document.addEventListener("DOMContentLoaded", function() {
  checkStudentAuth();
});

// Load header
fetch("header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
  });

// Load footer
fetch("footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });