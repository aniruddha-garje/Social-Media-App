const express = require('express');

const exphbs = require('express-handlebars');

//connect to MongoURI from another file
const keys = require('./config/keys.js');
const mongoose = require('mongoose');
//initialize application
const app = express();
app.engine('handlebars',exphbs({
	defaultLayout: 'main'
}));

//setup template engine
app.set('view engine','handlebars');

//setup static file to serve css,js, images
app.use(express.static('public'));

//connect to remote database
mongoose.connect(keys.MongoURI,{
	useNewUrlParser: true
})
.then(() =>{
	console.log('Connected to Remote Database');
}).catch((err)=>{
	console.log(err);
});

//app.use(express.static(__dirname + '/client' ));
//set Port
const port = process.env.PORT ||  3000;

app.get('/',(req,res) =>{
	res.render('home');
});

app.get('/about',(req,res) =>{
	res.render('about');
});

app.listen(port,() => {
	console.log('Server is running on port ' + port);
});