import express, { response } from "express";
import session from "express-session";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import mongoose from "mongoose";
import { cookie } from "express-validator";
import cookieParser from "cookie-parser";
import cheerio, { html } from 'cheerio';
import { stringify } from "querystring";


dotenv.config();
const { URI, PORT, SECRET_KEY, FNDG_API_KEY,FNDG_API_SEC} = process.env;
export{URI, PORT, SECRET_KEY};

let app = express();
let port = 3000;
const saltRounds = 10;
let movieobjs;
let selectedtitle;
let movielist;
let moviesaved;

let movieSelection;
let movieSelected;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "nycinema",
    password: "hello123",
    port: 5432,
    password: "MaTroy23",
    port: 5433,
});
// db.connect();
db.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to database');
    }
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.use(cookieParser());
app.set('view engine', 'ejs');

app.get("/", async (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    const movcon = await upcomingMovies();
    res.render("index.ejs",{url, movcon});
});

app.get("/generate_plan", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("generate_plan.ejs",{url});
});

app.get("/generate_plan_2", async (req, res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("multipage/generate_plan_2.ejs",{url, movieSelection});

});

app.get("/generate_plan_3", (req,res) => {
    const isLoggedIn = req.cookies.authToken;

    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";

    res.render("multipage/generate_plan_3.ejs",{url});
});

app.get("/generate_plan_5", async (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("multipage/generate_plan_5.ejs",{url, movieSelected});
});


app.get("/movies", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("movies.ejs",{url});
});

app.get("/genres", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("genres.ejs",{url});
});

app.get("/events", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("events.ejs",{url});
});

app.get("/about", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("about.ejs",{url});
});

app.get("/myaccount", async (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = "<button id='login'><a href='/logout'>Sign-out</a></button>";
    const userId = req.cookies.userId; 

    try {
        const movieQuery = await db.query("SELECT * FROM user_movies WHERE user_email = $1", [userId]);
        const eventQuery = await db.query("SELECT * FROM user_events WHERE user_email = $1", [userId]);

        const movies = movieQuery.rows;
        const events = eventQuery.rows;
        
        const numofplans = movieQuery.rowCount;
        res.render('myaccount.ejs', { url, movies, events, numofplans });
    } catch (err) {
        console.error('Error retrieving data:', err);
        res.status(500).send('An error occurred while loading your profile.');
    }
});

app.get('/logout', (req,res) => {
    res.clearCookie('authToken');
    res.clearCookie('userId');
    res.redirect('/');
});

app.post("/register", async (req,res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    try {
        const result = await db.query("SELECT * FROM accounts WHERE email = $1", [email,]);

        if(result.rows.length > 0) {
            res.json({msg: "Email already exists. Try logging in."});
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
            if(err) {
                console.error("Error hashing password: ", err);
                res.json({msg: "Error hashing password."});
            }
            else {
                console.log("Hashed Password: ", hash);
                await db.query(
                    "INSERT INTO accounts (username, email, password) VALUES ($1,$2,$3)", [username, email, hash]
                );
                res.json({msg: "Registration complete. Please log in."});
            }
            })
        }
    } catch(err) {
        console.log(err);
        res.json({msg: "An error occurred. Please try again."});
    }
});

app.post("/login", async (req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = {email: email};
    let accountExists = false;
    try {
        const result = await db.query("SELECT * FROM accounts WHERE email = $1", [email,]);

        if(result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;

            bcrypt.compare(password,storedHashedPassword, (err,result) => {
                if(err) {
                    console.error("Error comparing passwords: ", err);
                }
                else {
                    if (result) {
                        res.cookie('authToken', SECRET_KEY, { httpOnly: true, secure: true });
                        res.cookie('userId', email, { httpOnly: true, secure: false }); 
                        const url = "<button id='login'><a href='/myaccount'>My Account</a></button>";
                        res.json({login: true, url});
                    }
                    else {
                        let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
                        bcrypt.compare(req.body.password, fakePass);
                        res.json({msg: "Invalid email or password."})
                    }
                }
            });
        }
        else {
            res.json({msg: "User not found."})
        }
    }
    catch(err) {
        console.log(err);
        res.json({msg: "An error occurred. Please try again."});
    }
});

// Helper function to format date in MM/dd/yyyy hh:mm aa format
function formatDateForAPI(dateStr, time) {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year} ${time}`;
}

app.post('/submiteventdemo', async(req, res) => { 
    const date = req.body.sdate;
    const borough = req.body.borough;
    const zipcode = req.body.zipcode;

    if (!date || !borough || !zipcode) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // normalize borough input to match API expected values
    const boroughMap = {
        'Brooklyn': 'Bk',
        'Bronx': 'Bx',
        'Manhattan': 'Mn',
        'Staten Island': 'Si',
        'Queens': 'Qn'
    };
    const boroughCode = boroughMap[borough]

    // Create a Date object for the start date and end date
    const startDateObj = new Date(date);
    const startDate = formatDateForAPI(startDateObj, '12:00 AM');

    const endDateObj = new Date(startDateObj);
    const endDate = formatDateForAPI(endDateObj, '11:59 PM');

    console.log(`Received formatted parameters: start date=${startDate}, end date=${endDate}, borough=${boroughCode}, zipcode=${zipcode}`);
    
    // Construct the API URL with input parameters
    // correct url format example https://api.nyc.gov/calendar/search?startDate=07%2F24%2F2024%2012:00%20AM&endDate=07%2F24%2F2024%2011:59%20PM&boroughs=Bk&zip=11220&sort=DATE
    const url = `https://api.nyc.gov/calendar/search?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&boroughs=${boroughCode}categories=%22Athletic%22,%20%20%22Business%20%26%20Finance%22,%20%20%22City%20Government%20Office%22,%20%20%22Cultural%22,%20%20%22Education%22,%20%20%22Environment%22,%20%20%22Featured%22,%20%20%22Free%22,%20%20%22General%20Events%22,%20%20%22Health%20%26%20Public%20Safety%22,%20%20%22Hearings%20and%20Meetings%22,%20%20%22Holidays%22,%20%20%22Kids%20and%20Family%22,%20%20%22Parks%20%26%20Recreation%22,%20%20%22Street%20and%20Neighborhood%22,%20%20%22Tours%22,%20%20%22Volunteer%22&categoryOperator=OR&zip=${zipcode}&sort=DATE`;
    const headers = {
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.NYC_EVENTS_API_KEY,
    };

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`Error fetching events: ${response.statusText}`);
        }
        const events = await response.json();
        
        // return the items array
        if (events.items && events.items.length > 0) {
            res.json(events.items);
        } else {
            const sightseeingQuery = 'SELECT name, description, address FROM sightseeing_locations ORDER BY RANDOM() LIMIT 1';
            const { rows } = await db.query(sightseeingQuery);
            if (rows.length > 0) {
                const sightseeingLocation = rows[0];
                const sightseeingData = {
                    name: sightseeingLocation.name,
                    description: sightseeingLocation.description,
                    address: sightseeingLocation.address,
                };
                res.json([sightseeingData]); // return an array so it matches the event structure
            } else {
                res.json([]); // return an empty array if no sightseeing locations are found
            }
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});


app.post('/submitcontact', (req, res) => {
    const { name, email, message } = req.body;

    const query = `
        INSERT INTO contact_messages (name, email, message, submitted_at)
        VALUES ($1, $2, $3, now())
    `;

    db.query(query, [name, email, message], (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
        } else {
            res.json({ success: true, message: 'Message received!' });
        }
    });
});

async function upcomingMovies() {
    const options = {
        method: 'GET', // You're making a GET request to another API inside a POST handler
        url: 'https://api.themoviedb.org/3/movie/upcoming',
        headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMGQyYjljOTUwYWNmMDhmMzUwM2U5MDMyYjBjYTU1OCIsIm5iZiI6MTcyMzQ2ODY1NS43ODg0NTQsInN1YiI6IjY2YTgxNDFhYjI0ZGVlNWEyMDhkYzY5MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.L7picE4hKe2MtUTQ1vzvrtETTAgiMvIh8VOMvW41Axc'
        }
    };

    try {
        const response = await axios.request(options);
        const movies = response.data.results;
 

        const randomIndices = genRandNum(movies.length,12);

        // Get the movies corresponding to the random indices
        const randomMovies = randomIndices.map(index => movies[index]);

        let htmlString = '<div class="upcomingmovies">';
        randomMovies.forEach(movie => {
            htmlString += `
                <div class="ucmov">
                    <img class="ucmovpos" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
                    <div class="ucmovinfo">
                    <h5 class="ucmovtitle">${movie.title}</h6>
                    <h6 class="ucmovdate">${movie.release_date}</h6>
                    </div>
                </div>
            `;
        });
        htmlString += '</div>';
        return htmlString;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}

function genRandNum(totalMovies, arrsize) {
    const randomIndices = new Set();

    while (randomIndices.size < arrsize && randomIndices.size < totalMovies) {
        const randomIndex = Math.floor(Math.random() * totalMovies);
        randomIndices.add(randomIndex);
    }

    return Array.from(randomIndices);
};

function stringifyGenres(genre_ids) {
    let gentext = "(";
    genre_ids.forEach(genre => {
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
    gentext = gentext.slice(0, -2) + ")";
    return gentext;
};

app.post('/generateMovies', async(req, res) => { 
    const { genre } = req.body;  // Extract the genre from the request body

    const result = await generateMovies(genre);  // Call the function to get the movie data

    if (result.error) {
        return res.status(500).send(result.error);  // Handle the error case
    }


    const {  movieNames } = result;  // Extract necessary data
    movieSelection = movieNames;
    res.json({ movieNames }); 
});

async function generateMovies(genre) {
    const genreMap = {
        "Action": 28,
        "Adventure": 12,
        "Animation": 16,
        "Comedy": 35,
        "Crime": 80,
        "Documentary": 99,
        "Drama": 18,
        "Family": 10751,
        "Fantasy": 14,
        "History": 36,
        "Horror": 27,
        "Music": 10402,
        "Mystery": 9648,
        "Romance": 10749,
        "Science Fiction": 878,
        "TV Movie": 10770,
        "Thriller": 53,
        "War": 10752,
        "Western": 37
    };

    const selectedGenreId = genreMap[genre];

    const options = {
        method: 'GET', // You're making a GET request to another API inside a POST handler
        url: 'https://api.themoviedb.org/3/movie/now_playing'
        ,
        headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMGQyYjljOTUwYWNmMDhmMzUwM2U5MDMyYjBjYTU1OCIsIm5iZiI6MTcyMzQ2ODY1NS43ODg0NTQsInN1YiI6IjY2YTgxNDFhYjI0ZGVlNWEyMDhkYzY5MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.L7picE4hKe2MtUTQ1vzvrtETTAgiMvIh8VOMvW41Axc'
        }
    };

    try {
        const response = await axios.request(options);
        const movies = response.data.results;
        let filteredMovies;

        if(genre == "Random") {
            filteredMovies = movies;
        }
        else {
            filteredMovies = movies.filter(movie => movie.genre_ids.includes(selectedGenreId));
        }

        if (filteredMovies.length < 3) {
            const additionalMoviesNeeded = 3 - filteredMovies.length;
            const additionalMovies = movies
                .filter(movie => !filteredMovies.includes(movie)) // Exclude already selected movies
                .slice(0, additionalMoviesNeeded); // Take only the number of movies needed

            filteredMovies.push(...additionalMovies);
        }

        const randomIndices = genRandNum(filteredMovies.length,3);

  
        const randomMovies = randomIndices.map(index => filteredMovies[index]);
        movielist = randomMovies;
        const movieNames = [];
        let moviecard;
        randomMovies.forEach(movie => {
            const gentext = stringifyGenres(movie.genre_ids);
            const posterurl = "https://image.tmdb.org/t/p/w500" + movie.poster_path;
            moviecard = {
                title: movie.title,
                overview: movie.overview,
                genres: gentext,
                poster: posterurl
            };
            movieNames.push(moviecard);
        });

        return {
            movieNames
        };
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

app.post('/save-to-profile', async (req, res) => {
    const { event, movie } = req.body;
    const userId = req.cookies.userId; 

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    try {
        if (event) {
            await db.query(
                "INSERT INTO user_events (event_name, event_description, event_address, event_start, event_end, event_permalink, user_email) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [event.name, event.shortDesc, event.address, event.startDate, event.endDate, event.permalink, userId]
            );
        }

        if (movie) {
            await db.query(
                "INSERT INTO user_movies (movie_title, movie_poster, movie_overview, user_email) VALUES ($1, $2, $3, $4)",
                [movie.title, movie.poster, movie.overview, userId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving to profile:', err);
        res.status(500).json({ success: false, message: 'Error saving to profile' });
    }
});


app.post("/storeSelectedMovie", async (req, res) => {
    const { index } = req.body;
    movieSelected = movieSelection[index];
    res.json({movieSelected});
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});
