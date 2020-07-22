require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

// var encrypt = require('mongoose-encryption');   //low security then hasing
// var md5 = require('md5');  //more secure than mongoose-encryption, but less secure than bcrypt ..!
const bcrypt = require('bcrypt');
const saltRounds = 10;

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


// userScheme.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

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

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = User({
            email: req.body.username,
            password: hash,
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
});

app.post('/login', function (req, res) {
    const email = req.body.username;
    const password = req.body.password;

    User.find({ email: email }, function (err, foundUser) {
        if (!err) {                                                                          // check if no error
            if (foundUser.length > 0) {                                                     // check if user has a account   
                bcrypt.compare(password, foundUser[0].password, function (err, result) {
                    console.log(result);      // make user enter password in hash with salting 
                    if (result === true) {                                                // if save password == user currently enter password both hash match
                        res.render("secrets");                                           // then proceed forward
                    } else {
                        console.log("password mismatch");
                    }
                });
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