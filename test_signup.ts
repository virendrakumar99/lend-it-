import { query } from './src/db';
import bcrypt from 'bcryptjs';

try {
    const name = "Test Signup";
    const email = "testsignup999@lendit.app";
    const password = "Test@1234";
    const userType = "borrower";
    const passwordHash = bcrypt.hashSync(password, 10);

    console.log("Hashing done");

    // Testing the same insert query as auth.route.ts
    const result = query.run(
        `INSERT INTO users (name, email, phone, password_hash, role, user_type, lat, lon) VALUES (?, ?, ?, ?, 'user', ?, ?, ?)`,
        [name, email, null, passwordHash, userType, 19.076, 72.877]
    );
    console.log("Insert success:", result);

    const user = query.get(
        'SELECT user_id, name, email, role, user_type, rating_avg, created_at FROM users WHERE user_id = ?',
        [result.lastInsertRowid]
    );
    console.log("Select success:", user);

} catch (e) {
    console.error("DB Error:", e);
}
