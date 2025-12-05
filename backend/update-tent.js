const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Update the tent with the correct Decathlon link
db.run(
    `UPDATE gifts SET
     affiliate_link = ?,
     description = ?
     WHERE name LIKE '%MT900%Tent%'`,
    [
        'https://www.decathlon.co.ke/p/323513-43041-tunnel-trekking-tent-3-person-mt900-ultralight.html',
        'Ultralight 3-person tunnel tent perfect for trekking adventures in Kenya and beyond'
    ],
    function(err) {
        if (err) {
            console.error('Error updating tent:', err.message);
        } else {
            console.log(`✓ Updated tent information (${this.changes} rows affected)`);
        }

        // Also check what we have for tent
        db.get(`SELECT * FROM gifts WHERE name LIKE '%MT900%Tent%'`, [], (err, row) => {
            if (err) {
                console.error('Error querying tent:', err.message);
            } else if (row) {
                console.log('Current tent info:');
                console.log(`- Name: ${row.name}`);
                console.log(`- Price: KES ${row.price}`);
                console.log(`- Link: ${row.affiliate_link}`);
                console.log(`- Description: ${row.description}`);
            }

            db.close();
        });
    }
);