document.addEventListener("DOMContentLoaded", function() {
    console.log('Script is running'); // This should log when the page loads
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
        else if(login_btn_text == 'Sign-out') {
            try {
                fetch('/logout', {
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

    const moviedemo = document.getElementById('moviesdemo');
    if (moviedemo) {
        console.log('Form element:', moviedemo);
        moviedemo.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('Form submitted');

            try {
                const response = await fetch('/api', { 
                    method: 'POST'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                // if (data && Array.isArray(data.movies)) {
                //     data.movies.forEach(movie => {
                //         // if (movie.genre_ids.some(genreId => [28, 12, 16, 35, 27, 9648, 10749].includes(genreId))) {
                //         //     console.log('Movie Title:', movie.title, "genres", movie.genre_ids); // Log each movie's title
                //         // }
                //         // // Example of setting the first movie title to the DOM
                //         // document.querySelector(".movieTitle").textContent = movie.title;
        
                //         // // Example of setting the movie poster (for the first movie)
                //         // const moviePosterUrl = "https://image.tmdb.org/t/p/w500" + movie.poster_path;
                //         // document.querySelector(".moviePoster").src = moviePosterUrl;
                //     });
                // } else {
                //     document.querySelector(".movieTitle").textContent = "No movies available";
                // }
                for(let i = 1; i <= 3; i++) {
                    const movie = data.movies[i];
                    const title = ".movieTitle" + i;
                    const poster = ".moviePoster" + i;
                    const desc = ".movieDes" + i;
                    const gen = ".movieGen" + i;
                    let gentext = "(";

                    movie.genre_ids.forEach(genre => {
                        if (genre === 28) gentext += "Action, ";
                        if (genre === 12) gentext += "Adventure, ";
                        if (genre === 16) gentext += "Animation, ";
                        if (genre === 35) gentext += "Comedy, ";
                        if (genre === 80) gentext += "Crime, ";
                        if (genre === 99) gentext += "Documentary, ";
                        if (genre === 18) gentext += "Drama, ";
                        if (genre === 10751) gentext += "Family, ";
                        if (genre === 14) gentext += "Fantasy, ";
                        if (genre === 36) gentext += "History, ";
                        if (genre === 27) gentext += "Horror, ";
                        if (genre === 10402) gentext += "Music, ";
                        if (genre === 9648) gentext += "Mystery, ";
                        if (genre === 10749) gentext += "Romance, ";
                        if (genre === 878) gentext += "Science Fiction, ";
                        if (genre === 10770) gentext += "TV Movie, ";
                        if (genre === 53) gentext += "Thriller, ";
                        if (genre === 10752) gentext += "War, ";
                        if (genre === 37) gentext += "Western, ";
                    });

                    // Remove the last comma and space, then close the parentheses
                    gentext = gentext.slice(0, -2) + ")";
                    document.querySelector(title).textContent = movie.title;
                    document.querySelector(desc).textContent = movie.overview;
                    console.log(gentext)
                    document.querySelector(gen).textContent = gentext;
                    document.querySelector(poster).src =  "https://image.tmdb.org/t/p/w500" + movie.poster_path;
                }
            } catch (error) {
                console.error('Error:', error);
                document.querySelector(".movieTitle").textContent = "Failed to load movie data";
            }
        });
    }
    
    const eventdemo = document.querySelector('.eventsdemo')
        if  (eventdemo) {
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

            console.log('Received data:', data); // log the response to inspect its format
            if (data.error) {
                console.error(data.error);
                return;
            }
            document.querySelector('.eventsdiv1').classList.add("active");
            document.querySelector('.resetbox').classList.add("active");
            document.querySelector('.eventsdemobox').classList.remove("active");

            const eventContainer = document.querySelector('.eventsdiv1');
            eventContainer.innerHTML = ''; // clear previous events
    
            if (Array.isArray(data) && data.length > 0) {
                const eventContainer = document.querySelector('.eventsdiv1');
                eventContainer.innerHTML = ''; // clear previous events
                if (data[0].description) {
                    // display sightseeing location
                    const locationElement = document.createElement('div');
                    locationElement.classList.add('event1');
                    locationElement.innerHTML = `
                        <h5>Sightseeing Location:</h5>
                        <p><strong>${data[0].name}</strong></p>
                        <p>${data[0].description}</p>
                        <p>${data[0].address}</p>
                    `;
                    eventContainer.appendChild(locationElement);

                    // handle sightseeing location as the event
                    selectedEvent = {
                        name: data[0].name,
                        description: data[0].description,
                        address: data[0].address
                    };
                } else {
                    // display events
                    data.forEach((event, index) => {
                        if (index < 1) { // display only the first event
                            const eventElement = document.createElement('div');
                            eventElement.classList.add('event-item');
                    
                            // Create a title element
                            const titleElement = document.createElement('h5');
                            titleElement.textContent = `Event ${event.name}`; // ${index + 1}: ${event.name}`;
                            eventElement.appendChild(titleElement);

                            // Create a description element
                            const descriptionElement = document.createElement('p');
                            descriptionElement.classList.add('event-description');
                            descriptionElement.innerHTML = event.shortDesc || 'No description available';
                            eventElement.appendChild(descriptionElement);
                    
                            // Create a date element
                            const dateElement = document.createElement('p');
                            dateElement.classList.add('event-date');
                            const startDate = new Date(event.startDate).toLocaleString();
                            const endDate = new Date(event.endDate).toLocaleString();
                            dateElement.textContent = `Date and Time: ${startDate} - ${endDate}`;
                            eventElement.appendChild(dateElement);
                    
                            // Create a location element
                            const locationElement = document.createElement('p');
                            locationElement.classList.add('event-location');
                            locationElement.textContent = `Location: ${event.address}`;
                            eventElement.appendChild(locationElement);
                    
                            // Create a link to the event's permalink
                            const linkElement = document.createElement('a');
                            linkElement.href = event.permalink;
                            linkElement.textContent = 'More Details';
                            linkElement.classList.add('event-link');
                            eventElement.appendChild(linkElement);
                    
                            eventContainer.appendChild(eventElement);
                        }
                    });

                    // handle event from API
                    selectedEvent = {
                        name: data[0].name,
                        shortDesc: data[0].shortDesc,
                        startDate: data[0].startDate,
                        endDate: data[0].endDate,
                        address: data[0].address,
                        permalink: data[0].permalink
                    };
                }

                // save the selected event to localStorage
                localStorage.setItem('selectedEvent', JSON.stringify(selectedEvent));
            } else {
                console.error('Expected array but got:', data);
            }


        } catch(error) {
            console.error('Error:',error);
        }
    });
    }

    const reseteventdemo = document.querySelector('.reset');
    if (reseteventdemo) {
        reseteventdemo.addEventListener('submit', async function(event) {
            event.preventDefault();
            document.querySelector('.eventsdiv1').classList.remove("active");
            document.querySelector('.resetbox').classList.remove("active");
            document.querySelector('.eventsdemobox').classList.add("active");
        });
    }
});