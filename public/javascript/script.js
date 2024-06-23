document.addEventListener("DOMContentLoaded", function() {

const wrap = document.querySelector(".wrap");
const login = document.querySelector(".login-link");
const register = document.querySelector(".register-link");

register.addEventListener("click", () => {
    wrap.classList.add("active"); 
});



login.addEventListener("click", () => {
    wrap.classList.remove("active");
});

const login_btn = document.getElementById("login");

login_btn.addEventListener("click", () => {
    wrap.classList.add("active-popup");
});

const icon_close = document.querySelector(".icon-close");
icon_close.addEventListener("click", () => {
    wrap.classList.remove("active-popup");
});

});