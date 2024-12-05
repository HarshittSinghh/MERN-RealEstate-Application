const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/realEstateDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Property = require("./models/Property");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 }, // Session expires after 30 minutes
  })
);

const storage = multer.diskStorage({
  destination: "./public/images/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Credentials for admin and customer login
const credentials = {
  admin: { email: "admin@gmail.com", password: "admin@123" },
  customer: { email: "customer@gmail.com", password: "customer@123" },
};

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Routes

// Home route (check if logged in)
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});

// Login page
app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.render("login");
  }
});

// Handle login post request
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === credentials.admin.email && password === credentials.admin.password) {
    req.session.user = { role: "admin", email }; // Set session for admin
    res.redirect("/home");
  } else if (email === credentials.customer.email && password === credentials.customer.password) {
    req.session.user = { role: "customer", email }; // Set session for customer
    res.redirect("/home");
  } else {
    res.send("<h2>Login Failed</h2><p>Invalid email or password. Please try again.</p>");
  }
});

// Home page - Only accessible if logged in
app.get("/home", isAuthenticated, async (req, res) => {
  const properties = await Property.find();
  res.render("home", { properties, user: req.session.user });
});

// Add Property - Only accessible for admin
app.get("/add-property", isAuthenticated, (req, res) => {
  if (req.session.user.role === "admin") {
    res.render("addProperty");
  } else {
    res.send("<h2>Access Denied</h2><p>Only admins can add properties.</p>");
  }
});

// Add property POST request
app.post("/add-property", isAuthenticated, upload.single("image"), async (req, res) => {
  if (req.session.user.role === "admin") {
    const { title, description, price, location, propertyType, bedrooms, bathrooms, size, features } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : "";

    const newProperty = new Property({
      title,
      description,
      price,
      location,
      image,
      propertyType,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      size: parseInt(size),
      features: features ? features.split(",").map((feature) => feature.trim()) : [],
    });

    await newProperty.save();
    res.redirect("/home");
  } else {
    res.send("<h2>Access Denied</h2><p>Only admins can add properties.</p>");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
