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
import cheerio from 'cheerio';


dotenv.config();
const { URI, PORT, SECRET_KEY, FNDG_API_KEY,FNDG_API_SEC} = process.env;
export{URI, PORT, SECRET_KEY};

let app = express();
let port = 3000;
const saltRounds = 10;

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

app.get("/", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("index.ejs",{url});

});

app.get("/generate_plan", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";


    res.render("generate_plan.ejs",{url});
});

app.get("/generate_plan_2", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";


    res.render("multipage/generate_plan_2.ejs",{url});
});

app.get("/generate_plan_3", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";


    res.render("multipage/generate_plan_3.ejs",{url});
});

app.get("/generate_plan_4", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";


    res.render("multipage/generate_plan_4.ejs",{url});
});

app.get("/generate_plan_5", (req,res) => {
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";

    res.render("multipage/generate_plan_5.ejs",{url});
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
    const isLoggedIn = req.cookies.authToken;
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("index.ejs",{url});
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
    endDateObj.setDate(startDateObj.getDate() + 7);
    
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
                res.json(rows);
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

app.post('/api', async (req, res) => {
    const options = {
        method: 'GET', // You're making a GET request to another API inside a POST handler
        url: 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_release_type=2|3&release_date.gte={min_date}&release_date.lte={max_date}',
        headers: {
            'accept': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMGQyYjljOTUwYWNmMDhmMzUwM2U5MDMyYjBjYTU1OCIsIm5iZiI6MTcyMzQ2ODY1NS43ODg0NTQsInN1YiI6IjY2YTgxNDFhYjI0ZGVlNWEyMDhkYzY5MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.L7picE4hKe2MtUTQ1vzvrtETTAgiMvIh8VOMvW41Axc'
        }
    };

    try {
        const response = await axios.request(options);
        console.log(response.data.results);
        res.json({movies: response.data.results});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});