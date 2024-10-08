document.addEventListener("DOMContentLoaded", function() {
    console.log('Script is running'); // This should log when the page loads
    const wrap = document.querySelector(".wrap");


    const register = document.querySelector(".register-link");
    if(register){
        register.addEventListener("click", () => {
            wrap.classList.add("active"); 
            document.querySelector(".msg").classList.remove("active");
        });
    }

    const login = document.querySelector(".login-link");
    if(login) {
        login.addEventListener("click", () => {
            wrap.classList.remove("active");
            document.querySelector(".msg").classList.remove("active");
        });
    }


    const login_btn = document.getElementById("login");
    if(login_btn) {
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
                console.log("signout clicked");
                localStorage.clear();
                sessionStorage.clear();
                try {
                    fetch('/logout', {
                        method: 'GET',
                    });
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        });
    }
    


    const icon_close = document.querySelector(".icon-close");
    if(icon_close) {
        icon_close.addEventListener("click", () => {
            wrap.classList.remove("active-popup");
        });
    }
    

    const reg_sub = document.querySelector('.register-submit');
    if(reg_sub) {
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
                if(data.login) {
                    wrap.classList.remove("active-popup");
        
                    // Save the event and movie details after successful login
                    const selectedEvent = localStorage.getItem('selectedEvent');
                    const selectedMovie = sessionStorage.getItem('selectedMovie');
        
                    if (selectedEvent || selectedMovie) {
                        const saveResponse = await fetch('/save_plan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: selectedEvent ? JSON.parse(selectedEvent) : null,
                                movie: selectedMovie ? JSON.parse(selectedMovie) : null
                            })
                        });
        
                        const saveData = await saveResponse.json();
                        if (saveData.success) {
                            window.location.href = "/myaccount";
                        } else {
                            console.error("Failed to save plan to profile.");
                        }
                    } else {
                        window.location.href = "/myaccount";
                    }
                } else {
                    const result = data.msg;
                    document.querySelector('.msg').textContent = result;
                    document.querySelector('.msg').classList.add("active");
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
    

    const login_sub = document.querySelector('.login-submit');
    if(login_sub) {login_sub.addEventListener('submit', async function(event) {
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

                const moviesToSave = localStorage.getItem('selectedMovies');
                const eventsToSave = localStorage.getItem('selectedEvent');

            if (moviesToSave || eventsToSave) {
                await saveEventAndMovieDetails();
            }
                window.location.href = "/myaccount";
            } else {
                document.querySelector('.msg').textContent = data.msg;
                document.querySelector('.msg').classList.add("active");
            }
        } catch (error) {
            console.error('Error:', error);
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