import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import * as cheerio from 'cheerio';

let app = express();
let port = 3000;
const saltRounds = 10;

// this is for the database will uncomment once the sharing ability is figured out
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "nycinema",
    password: "",
    port: 5433,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');


app.get("/", (req,res) => {
    res.render("index.ejs");
});

app.get("/theaters", (req,res) => {
    res.render("theaters.ejs");
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
                        accountExists = true;
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});