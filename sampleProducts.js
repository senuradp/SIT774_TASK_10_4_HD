const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite Database
const db = new sqlite3.Database('./hoopkicks.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Sample Products
const sampleProducts = [
    {
        name: "Air Jordan 1 Chicago Bulls Low",
        description: "Iconic basketball sneakers with a sleek design.",
        price: 149.99,
        image_url: "/images/sneaker_7.jpg"
    },
    {
        name: "Nike Dunk Low",
        description: "Stylish and durable sneakers for everyday use.",
        price: 139.99,
        image_url: "/images/sneaker_2.jpg"
    },
    {
        name: "Adidas Yeezy Boost",
        description: "Comfortable and trendy sneakers with premium materials.",
        price: 199.99,
        image_url: "/images/sneaker_4.jpg"
    },
    {
        name: "Puma RS-X",
        description: "Lightweight sneakers with bold designs and vibrant colors.",
        price: 129.99,
        image_url: "/images/sneaker_5.jpg"
    },
    {
        name: "Reebok Zig Kinetica",
        description: "Futuristic sneakers with advanced cushioning and traction.",
        price: 119.99,
        image_url: "/images/sneaker_6.jpg"
    },
    {
        name: "Nike Dunk Low",
        description: "High-performance basketball shoe designed for the court.",
        price: 129.99,
        image_url: "/images/sneaker_3.jpg"
    }
];

// Insert Sample Data into Products Table
db.serialize(() => {
    const query = `INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)`;

    sampleProducts.forEach((product) => {
        db.run(query, [product.name, product.description, product.price, product.image_url], function (err) {
            if (err) {
                console.error('Error adding product:', err.message);
            } else {
                console.log(`Product added: ${product.name}`);
            }
        });
    });
});

// Close Database Connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
