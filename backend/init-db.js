const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Initialize database
const db = new sqlite3.Database(path.join(dbDir, 'wedding_registry.db'));

// Read and execute schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Split schema by semicolons and execute each statement
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

db.serialize(() => {
    statements.forEach((statement, index) => {
        db.run(statement, (err) => {
            if (err) {
                console.error(`Error executing statement ${index + 1}:`, err.message);
                console.error('Statement:', statement);
            } else {
                console.log(`✓ Executed statement ${index + 1}`);
            }
        });
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('✓ Database initialized successfully!');
        console.log('Database location:', path.join(dbDir, 'wedding_registry.db'));
    }
});