const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();


mongoose.connect("mongodb://localhost:27017/realEstateDB");
const Property = require("./models/Property");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 },
  })
);

// Multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: "./public/images/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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


// Index route - First page with a Login button
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.render("index"); 
  }
});

// Login route
app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.render("login");
  }
});

// Handle login POST request
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === credentials.admin.email && password === credentials.admin.password) {
    req.session.user = { role: "admin", email };
    res.redirect("/home");
  } else if (email === credentials.customer.email && password === credentials.customer.password) {
    req.session.user = { role: "customer", email };
    res.redirect("/home");
  } else {
    res.render("login", { error: "Invalid email or password. Please try again." });
  }
});

// Home route - Accessible only for logged-in users
app.get("/home", isAuthenticated, async (req, res) => {
  try {
    const properties = await Property.find();
    res.render("home", { properties, user: req.session.user });
  } catch (err) {
    res.status(500).send("An error occurred while fetching properties.");
  }
});

// Add Property route (Admin only)
app.get("/add-property", isAuthenticated, (req, res) => {
  if (req.session.user.role === "admin") {
    res.render("addProperty");
  } else {
    res.status(403).send("Access Denied: Only admins can add properties.");
  }
});

// Handle property addition
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

    try {
      await newProperty.save();
      res.redirect("/home");
    } catch (err) {
      res.status(500).send("An error occurred while adding the property.");
    }
  } else {
    res.status(403).send("Access Denied: Only admins can add properties.");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login?message=Logged%20out%20successfully");
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
