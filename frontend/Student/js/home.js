
/* ===========================
   LOAD HEADER
=========================== */

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

fetch("header.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("header").innerHTML = data;
    setActiveNavLink();
  });

/* ===========================
   LOAD FOOTER
=========================== */
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;
  });


/* ===========================
   DASHBOARD SUMMARY
=========================== */

document.addEventListener("DOMContentLoaded", function () {

  // Get stored complaints
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  let total = complaints.length;
  let resolved = 0;
  let pending = 0;

  complaints.forEach(function (complaint) {
    if (complaint.status === "Resolved") {
      resolved++;
    } else {
      pending++;
    }
  });

  // Update HTML numbers
  document.querySelector(".total-count").textContent = total;
  document.querySelector(".Resolved-count").textContent = resolved;
  document.querySelector(".Pending-count").textContent = pending;

});


/* ===========================
   COMMON ISSUES POLL
=========================== */

document.addEventListener("DOMContentLoaded", function () {

  const pollCards = document.querySelectorAll(".poll-card");

  pollCards.forEach(function (card, index) {

    const buttons = card.querySelectorAll("button");

    buttons.forEach(function (button) {

      button.addEventListener("click", function () {

        // Remove selection from both buttons
        buttons.forEach(btn => {
          btn.style.backgroundColor = "white";
          btn.style.color = "#333";
        });

        // Highlight selected button
        if (button.textContent === "Facing Issue") {
          button.style.backgroundColor = "rgb(220, 41, 41)";
          button.style.color = "white";
        } else {
          button.style.backgroundColor = "rgb(46, 204, 113)";
          button.style.color = "white";
        }

        // Save poll choice in localStorage
        localStorage.setItem("poll_" + index, button.textContent);

      });

    });

    // Load saved poll choice
    let savedChoice = localStorage.getItem("poll_" + index);

    if (savedChoice) {
      buttons.forEach(function (button) {
        if (button.textContent === savedChoice) {
          button.click();
        }
      });
    }

  });

});