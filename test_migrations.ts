import { db } from './src/db';

try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    console.log("Users columns:", columns.map((c: any) => c.name));

    // Add columns if they don't exist
    const colNames = columns.map((c: any) => c.name);
    if (!colNames.includes('lat')) {
        console.log("Adding lat column to users");
        db.exec("ALTER TABLE users ADD COLUMN lat REAL DEFAULT 19.076");
    }
    if (!colNames.includes('lon')) {
        console.log("Adding lon column to users");
        db.exec("ALTER TABLE users ADD COLUMN lon REAL DEFAULT 72.877");
    }
} catch (e) {
    console.error(e);
}
