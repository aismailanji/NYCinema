document.addEventListener("DOMContentLoaded", function() {
    const wrap = document.querySelector(".wrap");

    const register = document.querySelector(".register-link");
    register.addEventListener("click", () => {
        wrap.classList.add("active"); 
        document.querySelector(".msg").classList.remove("active");
    });

    const login = document.querySelector(".login-link");
    login.addEventListener("click", () => {
        wrap.classList.remove("active");
        document.querySelector(".msg").classList.remove("active");
    });

    const login_btn = document.getElementById("login");

    login_btn.addEventListener("click", () => {
        wrap.classList.add("active-popup");
    });

    const icon_close = document.querySelector(".icon-close");
    icon_close.addEventListener("click", () => {
        wrap.classList.remove("active-popup");
    });

    const login_sub = document.querySelector('.register-submit')
    login_sub.addEventListener('submit', async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        try {
            const response = await fetch('/register', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });

            const data = await response.json();
            const result = data.msg;
            document.querySelector('.msg').textContent = result;
            document.querySelector('.msg').classList.add("active");
        } catch (error) {
            console.error('Error:', error);
        }
    });




});