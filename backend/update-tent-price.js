const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Update the tent price to KES 36,000
db.run(
    `UPDATE gifts SET
     price = ?
     WHERE name LIKE '%MT900%Tent%'`,
    [36000],
    function(err) {
        if (err) {
            console.error('Error updating tent price:', err.message);
        } else {
            console.log(`✓ Updated tent price (${this.changes} rows affected)`);
        }

        // Verify the update
        db.get(`SELECT name, price FROM gifts WHERE name LIKE '%MT900%Tent%'`, [], (err, row) => {
            if (err) {
                console.error('Error querying tent:', err.message);
            } else if (row) {
                console.log('Updated tent info:');
                console.log(`- Name: ${row.name}`);
                console.log(`- Price: KES ${row.price.toLocaleString()}`);
            }

            db.close();
        });
    }
);