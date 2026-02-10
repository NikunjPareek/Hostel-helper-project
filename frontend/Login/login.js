/* --------------------
   GET ELEMENTS
-------------------- */
const captchaCode = document.getElementById("captchaCode");
const refreshCaptchaBtn = document.getElementById("refreshCaptcha");
const captchaInput = document.getElementById("captchaInput");

const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");

const loginForm = document.getElementById("loginForm");

/* --------------------
   GENERATE CAPTCHA
-------------------- */
function generateCaptcha() {
    // Generate random 4 digit number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    captchaCode.textContent = randomNumber;
}

/* --------------------
   REFRESH CAPTCHA
-------------------- */
refreshCaptchaBtn.addEventListener("click", function () {
    generateCaptcha();
    captchaInput.value = "";
});

/* --------------------
   SHOW / HIDE PASSWORD
-------------------- */
togglePasswordBtn.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordBtn.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePasswordBtn.textContent = "Show";
    }
});

/* --------------------
   FORM SUBMIT
-------------------- */
loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop page refresh

    if (captchaInput.value !== captchaCode.textContent) {
        alert("Captcha does not match. Please try again.");
        generateCaptcha();
        captchaInput.value = "";
        return;
    }

    alert("Login successful!");
});

/* --------------------
   INITIAL LOAD
-------------------- */
generateCaptcha();
