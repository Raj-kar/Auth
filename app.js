require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
var encrypt = require('mongoose-encryption');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

const userScheme = mongoose.Schema({
    email: String,
    password: String,
});

const secret = "ThisIsAScretForMyDatabaseUsers";
userScheme.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("User", userScheme);

app.get('/', function (req, res) {
    res.render("home");
});

app.get('/login', function (req, res) {
    res.render("login");
});

app.get('/register', function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    const newUser = User({
        email: req.body.username,
        password: req.body.password,
    });

    User.find({ email: req.body.username }, function (err, foundedUser) {
        if (foundedUser.length > 0) {
            console.log("user alreay exits");
        } else {
            newUser.save(function (err) {
                if (!err) {
                    res.render("secrets");
                } else {
                    console.log(err);
                }
            });
        }
    });
});

app.post('/login', function (req, res) {
    const email = req.body.username;
    const password = req.body.password;

    User.find({ email: email }, function (err, foundUser) {
        if (!err) {
            if (foundUser.length > 0) {
                if (foundUser[0].password === password) {
                    res.render("secrets");
                } else {
                    console.log("password mismatch");
                }
            } else {
                console.log("user not found");
            }
        } else {
            console.log(err);
        }
    });
});

app.post

app.listen(3000, function (req, res) {
    console.log("Server started at port 3000");
});