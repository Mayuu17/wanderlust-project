if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const session = require("express-session");
// Change this
const { MongoStore } = require("connect-mongo");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./util/ExpressError.js");

const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const mongoose = require("mongoose");

const User = require("./models/user.js");

// ================= ROUTES =================

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ================= DATABASE =================

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

// ================= VIEW ENGINE =================

app.engine("ejs", ejsMate);

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

// ================= STATIC FILES =================

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

// ================= GLOBAL VARIABLES =================

app.locals.mapToken = process.env.GEOAPIFY_API_KEY;

// ================= MONGO SESSION STORE =================

// ================= MONGO SESSION STORE =================
// ================= MONGO SESSION STORE =================
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "mysupersecretcode",
    },
    touchAfter: 24 * 3600, // 24 hours
});

// Agar store me koi error aaye toh use catch karne ke liye (Good practice)
store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

// ================= SESSION =================

const sessionOptions = {

  store,

  secret: process.env.SECRET,

  resave: false,

  saveUninitialized: false,

  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,

    maxAge: 7 * 24 * 60 * 60 * 1000,

    httpOnly: true,
  },
};

app.use(session(sessionOptions));

app.use(flash());

// ================= PASSPORT =================

app.use(passport.initialize());

app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

// ================= FLASH + CURRENT USER =================

app.use((req, res, next) => {

  res.locals.success = req.flash("success");

  res.locals.error = req.flash("error");

  res.locals.currUser = req.user;

  next();

});

// ================= ROUTES =================

app.use("/", userRouter);

app.use("/listings", listingsRouter);

app.use("/listings/:id/reviews", reviewsRouter);

// ================= HOME ROUTE =================

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ================= 404 =================

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {

  let { statusCode = 500, message = "Something went wrong!" } = err;

  res.status(statusCode).render("error.ejs", { message });

});

// ================= SERVER =================

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});