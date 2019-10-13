const express = require("express");
const app = express();

const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const passport=require("passport");
const localStrategy=require("passport-local");
const passportlocalmongoose=require("passport-local-mongoose");
const expresssession =require("express-session");

const expressSanitizer = require("express-sanitizer");

const methodOverride = require("method-override");

// App Config
mongoose.connect("mongodb://localhost/BlogApp");
app.use(bodyParser.urlencoded({useNewUrlParser:true}));
app.use(expresssession({
	secret:"BlogApp",
	resave: false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine","ejs");
app.use(expressSanitizer());
app.use(methodOverride("_method"));

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

// Mongoose/User Schema
var Blog = mongoose.model("Blog",blogSchema);


var userSchema =new mongoose.Schema({
	name:String,
	password:String
});

userSchema.plugin(passportlocalmongoose);
var user=mongoose.model("user",userSchema);

app.use(passport.initialize());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
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
	})
})
app.listen("3000",function(req,res){
	console.log("Server has started");
});

//Sign Up Route
app.get("/register",function(req,res){
	res.render("register");
  });
  
app.post("/register",function(req,res){
	 user.register(new user({username:req.body.username}),req.body.password,function(err,user)
	 {
		if(err)
		{   
			res.render("register");
		}
		passport.authenticate("local")(req,res,function()
		{ 
		  res.redirect("/blogs");
		})
	 })
});
  
//Login routes
app.get("/login",function(req,res){
	res.render("login");
});
  
app.post("/login",(req, res) => passport.authenticate('local', { successRedirect: '/blogs', failureRedirect: '/login', })(req, res));

//Logout routes
app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});
  
function isloggedin(req,res,next){
	 if(req.isAuthenticated())
	   next();
	 else{
	   res.redirect("/login");
	 }
}
 
