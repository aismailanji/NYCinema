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
    const url = isLoggedIn ? "<button id='login'><a href='/myaccount'>My Account</a></button>" : "<button id='login'>Sign-in/Sign-up</button>";
    res.render("myaccount.ejs",{url});
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

app.get('/logout', (req,res) => {
    res.clearCookie('authToken');
    const url = "<button id='login'>Sign-in/Sign-up</button>";
    res.render("index.ejs",{url});
})

// Token Refresh Route
app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ email: user.email });
        res.json({ accessToken: accessToken });
    });
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
    const boroughCode = boroughMap[borough] || 'Bk'; // Default to Brooklyn if unknown

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
    const url = `https://api.nyc.gov/calendar/search?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&boroughs=${boroughCode}&zip=${zipcode}&sort=DATE`;
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
        if (events.items) {
            res.json(events.items);
        } else {
            res.json([]); // Return an empty array if no items are found
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.get('/api/movies', async (req, res) => {
    const { mzipcode } = req.query;
    try {
        // Define the parameters
        const operation = 'moviesbypostalcodesearch';
        const parameters = `op=${operation}&postalcode=${mzipcode}`;
        const apiKey = FNDG_API_KEY;
        const sharedSecret = FNDG_API_SEC;

        // Generate the signature
        const sig = crypto.createHmac('sha1', sharedSecret)
                          .update(parameters)
                          .digest('hex');

        // Form the full request URL
        const url = `http://api.fandango.com/v1?${parameters}&apikey=${apiKey}&sig=${sig}`;

        // Make the API request
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});