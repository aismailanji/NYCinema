document.addEventListener("DOMContentLoaded", function() {
    const login_btn = document.getElementById("login");

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

    login_btn_text = login_btn.textContent;
    login_btn.addEventListener("click", ()=> {
        if(login_btn_text == 'Sign-in/Sign-up') {
            wrap.classList.add("active-popup");
        }
        else if(login_btn_text == 'My Account') {
            try {
                fetch('/myaccount', {
                    method: 'GET',
                });
            } catch (error) {
                console.error('Error:', error);
            }
        }
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
            if(data.login) {
                wrap.classList.remove("active-popup");
                window.location.href = "/myaccount";
            } else {
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

    const moviedemo = document.querySelector('.moviesdemo');
    moviedemo.addEventListener('submit', async function(event) {
        event.preventDefault();
        try {
            const response = await fetch(`/api/movies?postalcode=${postalCode}`);
            const data = await response.json();
            displayMovies(data);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    });

    function displayMovies(movies) {
        movies.forEach(movie => {
            const movieElement = document.querySelector('.moviesdiv2 .event1');
            movieElement.className = 'movie';
            movieElement.innerHTML = `
                <h2>${movie.title}</h2>
                <img src="${movie.poster}" alt="${movie.title} Poster">
                <p>Year: ${movie.year}</p>
                <p>Runtime: ${movie.runtime} minutes</p>
            `;
            moviesContainer.appendChild(movieElement);
        });
    }


    $(document).ready(function() {
        const query = "Gone with the Wind"; // or retrieve from input field
        $.ajax({
            url: '/api/movies',
            data: { query: query },
            success: searchCallback,
            error: function(xhr, status, error) {
                console.error('Error fetching movies:', error);
            }
        });
    });

    function searchCallback(data) {
        $(document.body).append('Found ' + data.total + ' results for ' + query);
        var movies = data.movies;
        $.each(movies, function(index, movie) {
            $(document.body).append('<h1>' + movie.title + '</h1>');
            $(document.body).append('<img src="' + movie.posters.thumbnail + '" />');
        });
    }

    const logoutbtn = document.getElementById("logout");
    logoutbtn.addEventListener('click', () => {
        alert("h1llo");
        // console.log("btn clicked for logout")
        // try {
        //     fetch('/logout', {
        //         method: 'GET',
        //     });
        // } catch (error) {
        //     console.error('Error:', error);
        // }
    });

    // document.body.addEventListener('click', function(event) {
    //     if (event.target.id === 'logout') { // Check if the clicked element is the logout button
    //         alert('clicked');
    //         try {
    //             fetch('/logout', {
    //                 method: 'GET',
    //             }).then(response => {
    //                 if (response.redirected) {
    //                     window.location.href = response.url; // Redirect if the response asks to
    //                 }
    //             });
    //         } catch (error) {
    //             console.error('Error:', error);
    //         }
    //     }
    // });
});

