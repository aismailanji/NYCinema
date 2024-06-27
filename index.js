import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

let app = express();
let port = 3000;
const saltRounds = 10;

// this is for the database will uncomment once the sharing ability is figured out
// const db = new pg.Client({
//     user: "postgres",
//     host: "localhost",
//     database: "nycinema",
//     password: "Hello123",
//     port: 5433,
// });
// db.connect();

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

// app.post("/register", async (req,res) => {
//     const username = req.body.username;
//     const email = req.body.email;
//     const password = req.body.password;


//     try {
//         const checkResult = await db.query("SELECT * FROM accounts WHERE email = $1", [email,]);

//         if(checkResult.rows.length > 0) {
//             res.json({msg: "Email already exists. Try logging in."});
//         }
//         else {
//             console.log("username: ", username);
//             console.log("email: ", email);
//             console.log("password: ", password);
//             bcrypt.hash(password, saltRounds, async (err, hash) => {
//                 if(err) {
//                     console.error("Error hashing password: ", err);
//                     res.json({msg: "Error hashing password."});
//                 }
//                 else {
//                     console.log("Hashed Password: ", hash);
//                     await db.query(
//                         "INSERT INTO accounts (username, email, password) VALUES ($1,$2,$3)", [username, email, hash]
//                     );
//                     res.json({msg: "Registration complete. Please log in."});
//                 }
//             })
//         }
//     }
//     catch(err) {
//         console.log(err);
//         res.json({msg: "An error occurred. Please try again."});
//     }
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});