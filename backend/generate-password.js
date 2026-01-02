const bcrypt = require('bcryptjs');

// Generate hash for password: wedding2026
const password = 'wedding2026';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nRun this SQL in Supabase SQL Editor:');
    console.log(`UPDATE admins SET password_hash = '${hash}' WHERE username = 'admin';`);
});
