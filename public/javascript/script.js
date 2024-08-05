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

    const reg_sub = document.querySelector('.register-submit')
    reg_sub.addEventListener('submit', async function(event) {
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

    const login_sub = document.querySelector('.login-submit');
    login_sub.addEventListener('submit', async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });

            const data = await response.json();
            console.log(data);
            // if(data.accountExists == true) {
            
            if(data.access_token) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                wrap.classList.remove("active-popup");
                document.querySelector('#login').textContent = "My Account";
                setTimeout(() => {
                    refreshToken(); 
                }, 45000);
            }
            else {
                const result = data.msg;    
                document.querySelector('.msg').textContent = result;
                document.querySelector('.msg').classList.add("active");
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    const eventdemo = document.querySelector('.eventsdemo')
    eventdemo.addEventListener('submit', async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        try {
            const response = await fetch('/submiteventdemo', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            // here you would have to check for and error when recveing data like no events found

            console.log('Received data:', data); // Log the response to inspect its format
            if (data.error) {
                console.error(data.error);
                return;
            }
            document.querySelector('.eventsdiv1').classList.add("active");
            document.querySelector('.resetbox').classList.add("active");
            document.querySelector('.eventsdemobox').classList.remove("active");

            const eventContainer = document.querySelector('.eventsdiv1');
            eventContainer.innerHTML = ''; // Clear previous events
    
            if (Array.isArray(data)) {
                const eventContainer = document.querySelector('.eventsdiv1');
                eventContainer.innerHTML = ''; // Clear previous events
    
                data.forEach((event, index) => {
                    if (index < 3) { // Display only the first three events
                        const eventElement = document.createElement('div');
                        eventElement.classList.add(`event${index + 1}`);
                        eventElement.textContent = `Event ${index + 1}: ${event.name}`;
                        eventContainer.appendChild(eventElement);
                    }
                });
            } else {
                console.error('Expected array but got:', data);
            }


        } catch(error) {
            console.error('Error:',error);
        }
    });

    const reseteventdemo = document.querySelector('.reset')
    reseteventdemo.addEventListener('submit', async function(event) {
        event.preventDefault();
        document.querySelector('.eventsdiv1').classList.remove("active");
        document.querySelector('.resetbox').classList.remove("active");
        document.querySelector('.eventsdemobox').classList.add("active");
    });


    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.querySelector('#login').textContent = "My Account";
        wrap.classList.remove("active-popup");

        refreshToken();
    }
    else {
        document.querySelector('#login').textContent = "Sign in/Sign Up";
        wrap.classList.remove("active-popup");
    };

    function refreshToken() {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            fetch('/refresh_token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ token: refreshToken })
            })
            .then(response => response.json())
            .then(data => {
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    setTimeout(() => {
                        refreshToken();
                    }, 45000); // Refresh token again after 45 seconds for testing
                } else {
                    logout();
                }
            })
            .catch(error => {
                console.error('Error refreshing token:', error);
                logout();
            });
        } else {
            logout();
        }
    }

    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('access_token');
        document.querySelector('#login').textContent = "Sign in/Sign Up";
        wrap.classList.remove("active-popup");
    }
});