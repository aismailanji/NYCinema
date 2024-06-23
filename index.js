import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

let app = express();
let port = 3000;
const saltRounds = 10;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "nycinema",
    password: "MaTroy23",
    port: 5433,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
// app.set('view engine', 'ejs');


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
    const email = req.body.username;
    const password = req.body.password;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email,]);

        if(checkResult.rows.length > 0) {
            res.send("Email already exists. Try logging in.");
        }
        else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if(err) {
                    console.error("Error hasing password: ", err);
                }
                else {
                    console.log("Hashed Password: ", hash);
                    await db.query(
                        "INSERT INTO users (email, password) VALUES ($1,$2)", [email, hash]
                    );
                    res.render("index.js");
                }
            })
        }
    }
    catch(err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});