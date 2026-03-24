// Admin footer.js

function loadAdminFooter() {
  fetch("footer.html")
    .then(function(r) { return r.text(); })
    .then(function(html) {
      document.body.insertAdjacentHTML("beforeend", html);
    });
}

document.addEventListener("DOMContentLoaded", function() {
  loadAdminFooter();
});
