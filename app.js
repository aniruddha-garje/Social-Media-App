const express = require('express');

const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const Handlebars = require('handlebars');
const passport = require('passport');
//connect to MongoURI from another file
const keys = require('./config/keys.js');
//User Collection
const User = require('./models/user');
const mongoose = require('mongoose');

require('./passport/google-passport');

const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
//initialize application
const app = express();

//Express Configs
app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(session({ 
  	secret: 'keyboard cat', 
  	resave:true,
  	saveUinitialized: true

  	}));
  app.use(passport.initialize());
  app.use(passport.session());

//Global Var for user
app.use((req,res,next)=>{
	res.locals.user = req.user|| null;
	next();
});

app.engine('handlebars',exphbs({
	defaultLayout: 'main',
	handlebars: allowInsecurePrototypeAccess(Handlebars)
}));

//setup template engine
app.set('view engine','handlebars');

//setup static file to serve css,js, images
app.use(express.static('public'));


mongoose.Promise = global.Promise;
//connect to remote database
mongoose.connect(keys.MongoURI,{
	useNewUrlParser: true
})
.then(() =>{
	console.log('Connected to Remote Database');
}).catch((err)=>{
	console.log(err);
});

app.use(express.static(__dirname + '/client' ));
//set Port
const port = process.env.PORT ||  3000;

app.get('/',(req,res) =>{
	res.render('home');
});

app.get('/about',(req,res) =>{
	res.render('about');
});

//Google Auth Route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));
 
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });
app.get('/profile', (req, res) => {
    User.findById({_id: req.user._id})
    .then((user) => {
        res.render('profile', {
            user:user
        });
    })
});

//Handle user logout route
app.get('/logout',(req,res)=>{
	req.logout();
	res.redirect('/');
});

app.listen(port,() => {
	console.log('Server is running on port ' + port);
});