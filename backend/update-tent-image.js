const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Update the tent with the actual Decathlon product image
db.run(
    `UPDATE gifts SET
     image_url = ?
     WHERE name LIKE '%MT900%Tent%'`,
    [
        'https://contents.mediadecathlon.com/p2606622/1cr1/k$e1ffcbd314b05733596cf2b6d919bdf5/tunnel-trekking-tent-3-person-mt900-ultralight.jpg?f=3000x0&format=auto'
    ],
    function(err) {
        if (err) {
            console.error('Error updating tent image:', err.message);
        } else {
            console.log(`✓ Updated tent image (${this.changes} rows affected)`);
        }

        // Verify the update
        db.get(`SELECT name, image_url FROM gifts WHERE name LIKE '%MT900%Tent%'`, [], (err, row) => {
            if (err) {
                console.error('Error querying tent:', err.message);
            } else if (row) {
                console.log('Updated tent info:');
                console.log(`- Name: ${row.name}`);
                console.log(`- Image: ${row.image_url}`);
            }

            db.close();
        });
    }
);