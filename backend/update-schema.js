const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Read and execute schema updates
const schemaUpdates = fs.readFileSync(path.join(__dirname, 'add-partial-reservations.sql'), 'utf8');

// Split schema by semicolons and execute each statement
const statements = schemaUpdates.split(';').filter(stmt => stmt.trim().length > 0);

db.serialize(() => {
    statements.forEach((statement, index) => {
        db.run(statement, (err) => {
            if (err) {
                console.error(`Error executing statement ${index + 1}:`, err.message);
                console.error('Statement:', statement);
            } else {
                console.log(`✓ Executed update statement ${index + 1}`);
            }
        });
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('✓ Database schema updated successfully!');
    }
});