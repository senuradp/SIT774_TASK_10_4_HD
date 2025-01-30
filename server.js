const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const formidable = require('formidable');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "hoopkickssecretkey";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, 'public_html')));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("index", { title: "Home" }));
app.get('/shop', (req, res) => res.render('shop', { title: "Shop" }));
app.get('/product', (req, res) => res.render('product', { title: "Product" }));
app.get('/news', (req, res) => res.render('news', { title: "News" }));
app.get('/contact', (req, res) => res.render('contact', { title: "Contact" }));
app.get('/about', (req, res) => res.render('about', { title: "About" }));
app.get('/feedback', (req, res) => res.render('feedback', { title: "Feedback" }));
app.get('/thank-you', (req, res) => res.render('thank-you', { title: "Thank You" }));
app.get('/register', (req, res) => res.render('register', { title: "Register" }));
app.get('/login', (req, res) => res.render('login', { title: "Login" }));
app.get('/profile', (req, res) => res.render('profile', { title: "Profile" }));


// Connect to SQLite Database
const db = new sqlite3.Database('./hoopkicks.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public_html/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// validate details
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone) => /^\d{10}$/.test(phone);

const isValidPassword = (password) => /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

// register user
app.post('/register-user', (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Formidable Parsing Error:", err);
            return res.status(500).json({ error: "Error processing form data", details: err.message });
        }

        // console.log("Received Fields:", fields);
        // console.log("Received Files:", files);

        // Convert fields to strings (since formidable parses them as arrays)
        const name = fields.name ? fields.name[0] : "";
        const email = fields.email ? fields.email[0] : "";
        const password = fields.password ? fields.password[0] : "";
        const phone = fields.phone ? fields.phone[0] : "";
        const address = fields.address ? fields.address[0] : "";
        const dob = fields.dob ? fields.dob[0] : "";

        // Ensure profile_picture is correctly processed
        let profilePicture = null;
        if (files.profile_picture) {
            const file = Array.isArray(files.profile_picture) ? files.profile_picture[0] : files.profile_picture;
            if (file.filepath) {
                profilePicture = `/uploads/${file.newFilename}`;
            } else {
                console.warn("Warning: profile_picture is missing filepath.");
            }
        }

        console.log("Final Profile Picture Path:", profilePicture);

        // Validate input fields
        if (!name || !email || !password || !phone || !address || !dob) {
            return res.status(400).json({ error: "All fields are required." });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        if (!isValidPhone(phone)) {
            return res.status(400).json({ error: "Invalid phone number. Must be 10 digits." });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ error: "Weak password! Must be at least 8 characters, with an uppercase letter, a number, and a special character." });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = `INSERT INTO users (name, email, password, phone, address, dob, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [name, email, hashedPassword, phone, address, dob, profilePicture], function (err) {
                if (err) {
                    console.error("Database Insert Error:", err);
                    return res.status(500).json({ error: "User already exists or database error." });
                }
                console.log("User Registered Successfully:", { id: this.lastID, name, email, profilePicture });
                res.json({ message: "Registration successful", profilePicture: profilePicture });
            });
        } catch (error) {
            console.error("Hashing Error:", error);
            res.status(500).json({ error: "Error hashing password" });
        }
    });
});

// login with jwt
app.post('/login-user', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful", token });
    });
});

// authenticate profile route using middleware
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Access Denied" });

    try {
        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid token" });
    }
}

// fetch User Data for Profile
app.get('/user-profile', authenticateToken, (req, res) => {
    const query = `SELECT name, email, phone, address, dob, profile_picture FROM users WHERE id = ?`;

    db.get(query, [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: "Failed to retrieve user data" });
        }
        res.json(user);
    });
});

// submit Feedback
app.post('/submit-feedback', (req, res) => {
    const { name, email, phone, message } = req.body;
    console.log(req.body);
    if (!name || !email || !phone || !message) {
        res.status(400).send(`
            <h1>Error</h1>
            <p>All the fields are required.</p>
            <a href="/feedback">Go back to the form</a>
        `);
        return;
    }

    const query = `INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)`;
    db.run(query, [name, email, message], (err) => {
        if (err) {
            console.error("Error saving feedback:", err.message);
            res.status(500).send(`
                <h1>Error</h1>
                <p>Failed to save feedback.</p>
                <a href="/feedback">Go back to the form</a>
            `);
        } else {
            res.redirect('/thank-you');
        }
    });
});

// load All Products
app.get('/products', (req, res) => {
    const query = `SELECT * FROM products ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err.message);
            return res.status(500).json({ error: 'Failed to fetch products.' });
        }
        res.status(200).json({ products: rows });
    });
});

// search Products
app.get('/products/search', (req, res) => {
    const searchQuery = req.query.q;
    if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    const query = `SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC`;
    db.all(query, [`%${searchQuery}%`, `%${searchQuery}%`], (err, rows) => {
        if (err) {
            console.error('Error searching products:', err.message);
            return res.status(500).json({ error: 'Failed to search products.' });
        }
        res.status(200).json({ products: rows });
    });
});

// handle errors
app.use((req, res, next) => {
    res.status(404).render("errors/error", { message: "Error : 404, The page you are looking for does not exist." });
});

app.use((err, req, res, next) => {
    console.error("Internal Server Error:", err);
    res.status(500).render("errors/error", { message: "Error : 500, Something went wrong on our end. Please try again later." });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
