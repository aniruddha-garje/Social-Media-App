const express = require('express');

const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const Handlebars = require('handlebars');
const passport = require('passport');
//connect to MongoURI from another file
const keys = require('./config/keys.js');
//Load Collection
const User = require('./models/user');
const Post = require('./models/post');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

//Link Passports to the server
require('./passport/google-passport');
require('./passport/facebook-passport');

//Link Helpers
const{
	ensureAuthentication,
	ensureGuest
} = require('./helpers/auth');

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

  app.use(methodOverride('_method'));

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

app.get('/',ensureGuest,(req,res) =>{
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

// FACEBOOK AUTH ROUTE
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });

app.get('/profile', ensureAuthentication, (req, res) => {
    Post.find({user: req.user._id})
   .populate('user')
   .sort({date: 'desc'})
   .then((posts) => {
       res.render('profile', {
           posts:posts
       });
   });
});

//Handle Route for All users
app.get('/users',ensureAuthentication, (req, res) => {
    User.find({}).then((users) => {
        res.render('users', {
            users:users
        });
    });
});

// Display one user profile
app.get('/user/:id', (req, res) => {
    User.findById({_id: req.params.id})
    .then((user) => {
        res.render('user', {
            user:user
        });
    });
});

//Handle 

//Handle Email post here
app.post('/addEmail',(req,res)=>{
		const email = req.body.email;
		User.findById({_id: req.user._id})
		.then((user)=>{
			user.email = email;
			user.save()
			.then(() => {
				res.redirect('/profile');
			});
		});
}) ;

//HANDLE Phone Post Route
app.post('/addPhone',(req,res)=>{
	const phone = req.body.phone;
	User.findById({_id: req.user._id})
		.then((user)=>{
			user.phone = phone;
			user.save()
			.then(() => {
				res.redirect('/profile');
			});
		});
});

//Handle Post route
app.get('/addPost', ensureAuthentication,(req,res)=>{
	res.render('addPost');
});

// handle post route
app.post('/savePost', ensureAuthentication, (req, res) => {
    var allowComments;
    if(req.body.allowComments){
        allowComments = true;
    }else{
        allowComments = false;
    }
    const newPost = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments: allowComments,
        user: req.user._id
    }
    new Post(newPost).save()
    .then(() => {
        res.redirect('/posts');
    });
});

//Handle Edit post route
app.get('/editPost/:id', ensureAuthentication,(req,res)=>{
    Post.findOne({_id:req.params.id})
    .then((post)=>{
      res.render('editingPost',{
        post: post
      });
    });
});

//Handle Put route to save edited Posts
app.put('/editingPost/:id', ensureAuthentication,(req,res)=>{
    Post.findOne({_id: req.params.id})
    .then((post)=>{
      var allowComments;
      if(req.body.allowComments){
          allowComments =true;
      }else{
        allowComments = false;
      }
      post.title = req.body.title;
      post.body = req.body.body;
      post.status = req.body.status;
      post.allowComments = allowComments;
      post.save()
      .then(()=>{
        res.redirect('/profile');
      });
    });
});

//HANDLE DELETE ROUTE
app.delete('/:id',(req,res)=>{
  Post.remove({_id:req.params.id})
  .then(()=>{
      res.redirect('profile');
  });
});


// handle posts route
app.get('/posts', ensureAuthentication, (req, res) => {
    Post.find({status:'public'})
    .populate('user')
    .populate('comments.commentUser')
    .sort({date:'desc'})
    .then((posts) => {
        res.render('publicPosts', {
            posts:posts
        });
    });
});

app.get('/showposts/:id', (req, res) => {
    Post.find({user: req.params.id, status: 'public'})
    .populate('user')
    .sort({date: 'desc'})
    .then((posts) => {
        res.render('showUserPosts', {
            posts:posts
        });
    });
});


//Save Comment in Database
app.post('/addComment/:id', (req, res) => {
    Post.findOne({_id: req.params.id})
    .then((post) => {
        const newComment = {
            commentBody: req.body.commentBody,
            commentUser: req.user._id
        }
        post.comments.push(newComment)
        post.save()
        .then(() => {
            res.redirect('/posts');
        });
    });
});


//Handle user logout route
app.get('/logout',(req,res)=>{
	req.logout();
	res.redirect('/');
});

app.listen(port,() => {
	console.log('Server is running on port ' + port);
});