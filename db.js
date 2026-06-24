import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DB_POSTGRES_URL_NO_SSL;
const sql = postgres(process.env.DB_POSTGRES_URL_NO_SSL);
console.log(`Connection String: ${connectionString}`);
console.log(`NO SSL-${process.env.DB_POSTGRES_URL_NO_SSL}`);
console.log(process.env.DB_POSTGRES_URL_BASEURL);

async function setupDB() {
    console.log("Database Connected");
    console.log("Starting DB...");
    try {
        await sql`
        CREATE TABLE IF NOT EXISTS Systems (
                country_code TEXT,
                name TEXT,
                location TEXT,
                system_id TEXT PRIMARY KEY,
                url TEXT,
                auto_discovery_url TEXT,
                supported_versions TEXT,
                authentication_info_url TEXT,
                authentication_type TEXT,
                authentication_parameter_name TEXT,
                metro_code TEXT
`;

    } catch (err) {
        console.error(err);
    }
}
export { sql, setupDB };