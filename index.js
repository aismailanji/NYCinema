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

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "nycinema",
    password: "hello123",
    port: 5432,
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
    const url = "<button id='login'><a href='/myaccount'>My Account</a></button>";
    const { genre, theater } = req.query;  // Extract the genre and theater from the query string
    const result = await generateMovies(genre);

    if (result.error) {
        res.status(500).send(result.error);
    } else {
        const { htmlString, movieNames } = result;
        res.render("multipage/generate_plan_2.ejs", { url, display: htmlString, movie1: movieNames[0], movie2: movieNames[1], movie3: movieNames[2] });
    }
});

app.get("/generate_plan_3", (req,res) => {
    const isLoggedIn = req.cookies.authToken;

    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    const { selectedMovieName } = req.query;  // Extract the selected movie name from the query string
    selectedtitle = selectedMovieName;
    res.render("multipage/generate_plan_3.ejs",{url});
});

app.get("/generate_plan_4", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";


    res.render("multipage/generate_plan_4.ejs",{url});
});

app.get("/generate_plan_5", async (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    const display = await findMovie(selectedtitle);
    res.render("multipage/generate_plan_5.ejs",{url, display});
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

app.get("/myaccount", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = "<button id='login'><a href='/logout'>Sign-out</a></button>" 
    res.render("myaccount.ejs",{url});
});

app.get('/logout', (req,res) => {
    res.clearCookie('authToken');
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
        }
        else {
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
    }
    catch(err) {
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
                        console.log("login sucessfull");
                        const url = "<button id='login'><a href='/myaccount'>My Account</a></button>";
                        // res.cookie('loggedIn', 'true', { maxAge: 240000, httpOnly: true }); // 3 days
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
    //res.json({ event1: "This is Event 1", event2: "This is Event 2", event3: "This is Event 3"});

    if (!date || !borough || !zipcode) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    //console.log(`Received parameters: date=${date}, borough=${borough}, zipcode=${zipcode}`);
    
    // Normalize borough input to match API expected values
    const boroughMap = {
        'Brooklyn': 'Bk',
        'Bronx': 'Bx',
        'Manhattan': 'Mn',
        'Staten Island': 'Si',
        'Queens': 'Qn'
    };
    const boroughCode = boroughMap[borough] // || 'Bk'; // Default to Brooklyn if unknown

    // Format the date to MM/dd/yyyy hh:mm aa format
    // const formattedDate = formatDateForAPI(date);

    // Format the start and end dates
    //const startDate = formatDateForAPI(date, '12:00 AM');
    //const endDate = formatDateForAPI(date, '11:59 PM');

    // Create a Date object for the start date
    const startDateObj = new Date(date);
    
    // Format the start date
    const startDate = formatDateForAPI(startDateObj, '12:00 AM');

    // Add 7 days to the start date to get the end date
    const endDateObj = new Date(startDateObj);
    //endDateObj.setDate(startDateObj.getDate() + 7);
    
    // Format the end date
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
        
        // Return the items array
        if (events.items && events.items.length > 0) {
            res.json(events.items);
        } else {
            //res.json([]); // Return an empty array if no items are found
            const sightseeingQuery = 'SELECT name, description, address FROM sightseeing_locations ORDER BY RANDOM() LIMIT 1';
            const { rows } = await db.query(sightseeingQuery);
            if (rows.length > 0) {
                //res.json(rows);
                const sightseeingLocation = rows[0];
                const sightseeingData = {
                    name: sightseeingLocation.name,
                    description: sightseeingLocation.description,
                    address: sightseeingLocation.address,
                    // Add any other necessary fields here
                };
                res.json([sightseeingData]); // Return an array so it matches the event structure
            } else {
                res.json([]); // Return an empty array if no sightseeing locations are found
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
        console.log("upcoming movies");
        console.log(response.data.results);
        console.log("Total movies fetched:", movies.length); // Debugging info

        const randomIndices = genRandNum(movies.length,12);

        console.log(randomIndices);
        // Get the movies corresponding to the random indices
        const randomMovies = randomIndices.map(index => movies[index]);
        console.log("Randomly selected movies:", randomMovies); // Debugging info

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

        // console.log(htmlString);
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
        console.log(response.data.results);
        const movies = response.data.results;

        const filteredMovies = movies.filter(movie => movie.genre_ids.includes(selectedGenreId));

        // console.log("Filtered Movies:", filteredMovies);

        const randomIndices = genRandNum(filteredMovies.length,3);

  
        const randomMovies = randomIndices.map(index => filteredMovies[index]);
        movielist = randomMovies;
        console.log("Randomly selected movies:", randomMovies); // Debugging info

        let movie1, movie2, movie3;
        let htmlString = '<div class="displayingmov">';
        const movieNames = [];
        randomMovies.forEach(movie => {
            const gentext = stringifyGenres(movie.genre_ids);
            movieNames.push(movie.title);
            htmlString += `
                <div class="moviesdisplay">
                    <div class="moviePoster">
                        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
                        <div class="movieInfo">
                            <h6 class="movieTitle">${movie.title}</h6>
                            <p class="movieGen">${gentext}</p>
                            <p class="movieDes">${movie.overview}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        htmlString += '</div>';

        return {
            htmlString,
            movieNames
        };
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};


async function findMovie(selectedtitle) {
    try {
        // Find the movie in the movielist array by matching the title
        const filteredMovie = movielist.find(movie => movie.title === selectedtitle);

        console.log("the filtermocie", filteredMovie);
        // If no movie is found, handle it appropriately
        if (!filteredMovie) {
            console.error("Movie not found:", selectedtitle);
            return '<p>Movie not found</p>';
        }

        // Generate the HTML for the selected movie
        let htmlString = '<div class="displayingmov">';
        const gentext = stringifyGenres(filteredMovie.genre_ids);
        htmlString += `
            <div class="moviesdisplay">
                <div class="moviePoster5">
                    <img src="https://image.tmdb.org/t/p/w500${filteredMovie.poster_path}" alt="${filteredMovie.title} Poster">
                    <div class="movieInfo5">
                        <h6 class="movieTitle">${filteredMovie.title}</h6>
                    </div>
                </div>
            </div>
        `;
        htmlString += '</div>';

        console.log("the html stuff", htmlString);
        return htmlString;
    } catch (error) {
        console.error("Error finding movie:", error);
        return '<p>Failed to retrieve movie details</p>';
    }
}


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});