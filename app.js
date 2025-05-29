if (process.env.NODE_ENV !== "production") {
  // if the environment is not production then only we will load the .env file
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
// ./ means current directory
const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected To DB");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600, // time in seconds after which the session will be updated
});

store.on("error", (e) => {
  console.log("Error is mongo Session Store ", e);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true,
  },
};

// app.get("/", (req, res) => {
//   res.send("Welcome to Wanderlust");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// inside the passport the method LocalStrategy that we created in this method all the users that will come
// will be authenticated by this LocalStrategy method and for authenticate those users we will
// use authenticate method

passport.serializeUser(User.serializeUser()); // adding all the user related info into the session
passport.deserializeUser(User.deserializeUser()); // removing all the user related info from the session

app.use((req, res, next) => {
  res.locals.success = req.flash("success"); // flash message
  res.locals.error = req.flash("error"); // flash message
  // console.log(res.locals.success);
  res.locals.currentUser = req.user; // current user
  next();
});

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmil.com",
//     username: "Yash",
//   });
//   let registeredUser = await User.register(fakeUser, "helloworld");
// 2 parameter is password
//   res.send(registeredUser);
// });

// parent route merge with child route in routes folder because we have to send this :id to the child route in route folder
app.use("/listings", listingRouter); // those deleted same common routes part are use here
app.use("/listings/:id/reviews", reviewRouter); // common path will be this for all routes of this file
// this route that we write will be matching those routes in the review.js file
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
  // res.status(statusCode).send(message);
});

app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});
