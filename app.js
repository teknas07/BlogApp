const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const expressSanitizer = require("express-sanitizer");
const methodOverride = require("method-override");
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require("passport");
const  LocalStrategy  = require("passport-local");
const User = require("./models/user"); 
const flash=require("connect-flash");

// App Config
mongoose.connect("mongodb://localhost/BlogApp",{useNewUrlParser: true ,useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended: true}));


app.set("view engine","ejs");
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());

// Mongoose/Model Config
var blogSchema = new mongoose.Schema({
	title:String,
	image:String,
	body:String,
	created: {
		type:Date,
		default:Date.now
	}
});

var Blog = mongoose.model("Blog",blogSchema);

    
//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret:"ABC@1234",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//This is used to get the current user for every page
app.use(function(req,res,next){
   res.locals.currentUser = req.user;
   res.locals.message=req.flash("error");
   res.locals.smessage=req.flash("success");
   next();
});
// Restful Routes

app.get("/",function(req,res){
	res.redirect("/blogs");
});


app.get("/blogs",function(req,res){
	Blog.find({},function(err,blogs){
		if(err){
			console.log(err);
		}
		else{
			res.render("index",{blogs:blogs});
		}
	});
});

// New Route
app.get("/blogs/new",function(req,res){
	res.render("new");
});

// Create Route
app.post("/blogs", function(req, res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
    var formData = req.body.blog;
   Blog.create(formData, function(err, newBlog){
       console.log(newBlog);
      if(err){
          res.render("new");
      } else {
          res.redirect("/blogs");
      }
   });
});


// Show Route
app.get("/blogs/:id",function(req,res){
	Blog.findById(req.params.id,function(err,foundBlog){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.render("show",{blog:foundBlog});
		}
	});
});

// Edit Route
app.get("/blogs/:id/edit",function(req,res){
	Blog.findById(req.params.id,function(err,foundBlog){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.render("edit",{blog:foundBlog});
		}
	});
});

// Update Route

app.put("/blogs/:id",function(req,res){
		req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updateBlog){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.redirect("/blogs/" + req.params.id);
		}
	});
});

//Delete Route
app.delete("/blogs/:id",function(req,res){
	Blog.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.redirect("/blogs")
		}
	});
});

//Auth Routes

//show register form
app.get('/register',function(req,res){
	res.render('register');	
});

//handle register logic
app.post('/register',function(req,res){
	var newUser = new User({username:req.body.username});
	
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			req.flash("error",err.message);
			res.redirect('/register');
		}
		passport.authenticate("local")(req,res,function(){
			//If user has successfully registered than redirect it to /blogs
			req.flash("success","welcome"+ user.username);
			res.redirect("/blogs");	
		});
	});
	
});


//login form
app.get('/login',function(req,res){
	res.render("login");	
});

//handling the login logic
app.post('/login',passport.authenticate("local",{
	successRedirect:"/blogs",
	failureRedirect:"/login",
	failureFlash:true
}),function(req,res){
	req.flash("success","Successfully logged u in !!!")
});

//logout logic
app.get("/logout",function(req, res) {
	req.logout();
	req.flash("success","successfully logged u out");
    res.redirect("/blogs");
});




app.listen("3000",function(req,res){
	console.log("Server has started");
});

