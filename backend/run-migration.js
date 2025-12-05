const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Read migration file
const migrationFile = process.argv[2] || 'add-quantity.sql';
const migration = fs.readFileSync(path.join(__dirname, migrationFile), 'utf8');

// Split by semicolons and execute each statement
const statements = migration.split(';').filter(stmt => stmt.trim().length > 0);

db.serialize(() => {
    statements.forEach((statement, index) => {
        db.run(statement, (err) => {
            if (err) {
                console.error(`❌ Error executing statement ${index + 1}:`, err.message);
                console.error('Statement:', statement);
            } else {
                console.log(`✓ Executed statement ${index + 1}`);
            }
        });
    });
});

db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err.message);
    } else {
        console.log('✅ Migration completed successfully!');
    }
});
