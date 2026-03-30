import { query } from './src/db';
import bcrypt from 'bcryptjs';

const email = 'vishal@gamil.com';
const user = query.get('SELECT * FROM users WHERE email = ?', [email]) as any;

if (user) {
    console.log(`User found: ${user.name} (${user.email})`);
    const newHash = bcrypt.hashSync('User@1234', 10);
    query.run('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, email]);
    console.log('Password successfully reset to: User@1234');
} else {
    console.log('User not found in database.');
}
