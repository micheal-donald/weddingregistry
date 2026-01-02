const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'wedding2026';
    const hash = await bcrypt.hash(password, 10);
    console.log('\n===========================================');
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('===========================================\n');
    console.log('Run this in Supabase SQL Editor:\n');
    console.log(`UPDATE admins SET password_hash = '${hash}' WHERE username = 'admin';`);
    console.log('\n===========================================\n');
}

generateHash();
