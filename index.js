import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';


dotenv.config();
const { URI, PORT, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
export{URI, PORT, ACCESS_TOKEN_SECRET};

let app = express();
let port = 3000;
const saltRounds = 10;

// this is for the database will uncomment once the sharing ability is figured out
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "nycinema",
    password: "hello123",
    port: 5432,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');


app.get("/", (req,res) => {
    res.render("index.ejs");
});

app.get("/generate_plan", (req,res) => {
    res.render("generate_plan.ejs");
});

app.get("/generate_plan_2", (req,res) => {
    res.render("multipage/generate_plan_2.ejs");
});

app.get("/generate_plan_3", (req,res) => {
    res.render("multipage/generate_plan_3.ejs");
});

app.get("/generate_plan_4", (req,res) => {
    res.render("multipage/generate_plan_4.ejs");
});

app.get("/generate_plan_5", (req,res) => {
    res.render("multipage/generate_plan_5.ejs");
});

app.get("/movies", (req,res) => {
    res.render("movies.ejs");
});

app.get("/genres", (req,res) => {
    res.render("genres.ejs");
});

app.get("/events", (req,res) => {
    res.render("events.ejs");
});

app.get("/about", (req,res) => {
    res.render("about.ejs");
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
                    if(result) {
                        console.log("Account found and password correct.");
                        const access_token = generateAccessToken(user);
                        const refresh_token = generateRefreshToken(user);
                        res.json({access_token: access_token, refresh_token: refresh_token});
                        // this can be changed depending on what we want the user to see after logging in.
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

app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ email: user.email });
        res.json({ accessToken: accessToken });
    });
});

app.post('/refresh_token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ email: user.email });
        res.json({ accessToken: accessToken });
    });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function generateAccessToken(user) {
    return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
}

function generateRefreshToken(user) {
    return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '1m' });
}

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});