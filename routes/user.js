const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.createUser));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    savedRedirectUrl, // that url we saving into locals before passport remove that req.session.redirectUrl
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }), // passport.authenticate is a middleware that will authenticate the user before logging in
    // 1 is strategy name, // failureRedirect is the path to redirect if authentication fails
    userController.login
  ); // passport.authenticate is a middleware that will authenticate the user before logging in

router.get("/logout", userController.logout);

module.exports = router;

// router.get("/signup", userController.renderSignupForm);

// router.post("/signup", wrapAsync(userController.createUser));

// router.get("/login", userController.renderLoginForm);

// after login passport reset the session
// router.post(
//   "/login",
//   savedRedirectUrl, // that url we saving into locals before passport remove that req.session.redirectUrl
//   passport.authenticate("local", {
//     failureRedirect: "/login",
//     failureFlash: true,
//   }), // passport.authenticate is a middleware that will authenticate the user before logging in
// 1 is strategy name, // failureRedirect is the path to redirect if authentication fails
//   userController.login
// ); // passport.authenticate is a middleware that will authenticate the user before logging in
