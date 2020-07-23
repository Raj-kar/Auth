require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
// const passportLocal = require('passport-local');   not need it because passport-local-mongoose already have it .!
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



mongoose.set('useCreateIndex', true);

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });



// var encrypt = require('mongoose-encryption');   //low security then hasing
// var md5 = require('md5');  //more secure than mongoose-encryption, but less secure than bcrypt ..!
// const bcrypt = require('bcrypt');           // less secure than passport auth
// const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: 'This a very secret message',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


const userScheme = mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
});

userScheme.plugin(passportLocalMongoose);
userScheme.plugin(findOrCreate);

// userScheme.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("User", userScheme);

passport.use(User.createStrategy());

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get('/', function (req, res) {
    res.render("home");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/login', function (req, res) {
    res.render("login");
});

app.get('/register', function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {

    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     const newUser = User({
    //         email: req.body.username,
    //         password: hash,
    //     });

    //     User.find({ email: req.body.username }, function (err, foundedUser) {
    //         if (foundedUser.length > 0) {
    //             console.log("user alreay exits");
    //         } else {
    //             newUser.save(function (err) {
    //                 if (!err) {
    //                     res.render("secrets");
    //                 } else {
    //                     console.log(err);
    //                 }
    //             });
    //         }
    //     });
    // });
    User.register({ username: req.body.username, active: false }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/secrets', function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect('/');
})

app.post('/login', function (req, res) {
    // const email = req.body.username;
    // const password = req.body.password;

    // User.find({ email: email }, function (err, foundUser) {
    //     if (!err) {                                                                          // check if no error
    //         if (foundUser.length > 0) {                                                     // check if user has a account   
    //             bcrypt.compare(password, foundUser[0].password, function (err, result) {   // make user enter password in hash with salting 
    //                 if (result === true) {                                                // if save password == user currently enter password both hash match
    //                     res.render("secrets");                                           // then proceed forward
    //                 } else {
    //                     console.log("password mismatch");
    //                 }
    //             });
    //         } else {
    //             console.log("user not found");
    //         }
    //     } else {
    //         console.log(err);
    //     }
    // });

    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.logIn(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect('/login');
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }
    })

});


app.listen(3000, function (req, res) {
    console.log("Server started at port 3000");
});