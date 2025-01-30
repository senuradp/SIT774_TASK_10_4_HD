const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite Database
const db = new sqlite3.Database('./hoopkicks.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Create Feedback Table
        db.run(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating feedback table:', err.message);
            else console.log('Feedback table created or already exists.');
        });

        // Create Products Table
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating products table:', err.message);
            else console.log('Products table created or already exists.');
        });

        // Create Users Table with More Details
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                dob TEXT NOT NULL,
                profile_picture TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err.message);
            else console.log('Users table created or already exists.');
        });

        // Drop Users Table if it exists
        // db.run(`DROP TABLE IF EXISTS users`, (err) => {
        //     if (err) console.error('Error dropping users table:', err.message);
        //     else console.log('Users table dropped.');
        // });

        db.close((err) => {
            if (err) console.error('Error closing database:', err.message);
            else console.log('Database connection closed.');
        });
    }
});
