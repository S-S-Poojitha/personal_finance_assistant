const bcrypt = require('bcrypt');

async function generateUser() {
    const password = 'pass123';
    const hashed = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashed);
}

generateUser();
