const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'wedding_registry.db');
const db = new sqlite3.Database(dbPath);

// Generate proper bcrypt hash for 'wedding2026'
const password = 'wedding2026';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        db.close();
        return;
    }

    console.log('Generated hash for "wedding2026":', hash);

    // Update the admin password hash
    db.run(
        `UPDATE admins SET password_hash = ? WHERE username = 'admin'`,
        [hash],
        function(err) {
            if (err) {
                console.error('Error updating password:', err.message);
            } else {
                console.log(`✓ Updated admin password (${this.changes} rows affected)`);
                console.log('You can now login with:');
                console.log('Username: admin');
                console.log('Password: wedding2026');
            }

            db.close();
        }
    );
});