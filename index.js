import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

let app = express();
let port = 3000;

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


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});