const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Read and execute schema updates
const schemaUpdates = fs.readFileSync(path.join(__dirname, 'add-partial-flag.sql'), 'utf8');

// Split schema by semicolons and execute each statement
const statements = schemaUpdates.split(';').filter(stmt => stmt.trim().length > 0);

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

    // Show results
    db.all(`
        SELECT name, price, allow_partial_reservations
        FROM gifts
        ORDER BY price DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Error querying gifts:', err.message);
        } else {
            console.log('\n📊 Gift partial reservation settings:');
            rows.forEach(gift => {
                const status = gift.allow_partial_reservations ? '✅ Partial' : '❌ Simple';
                console.log(`${status} | KES ${gift.price.toLocaleString().padStart(8)} | ${gift.name}`);
            });
        }

        db.close();
    });
});