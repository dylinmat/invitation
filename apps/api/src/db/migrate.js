const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Load environment variables from .env.railway if running locally
if (process.env.NODE_ENV !== "production") {
  const envPath = path.join(process.cwd(), ".env.railway");
  if (fs.existsSync(envPath)) {
    try {
      const dotenv = require("dotenv");
      dotenv.config({ path: envPath });
      console.log("📄 Loaded environment from .env.railway");
    } catch (e) {
      // dotenv not installed, try manual parsing
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && !key.startsWith("#") && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log("📄 Loaded environment from .env.railway (manual parse)");
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required for migration.");
  console.error("   Set DATABASE_URL environment variable or create .env.railway file.");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "../../../../db/schema.sql");

if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema file not found: ${schemaPath}`);
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, "utf8");

const pool = new Pool({ 
  connectionString: DATABASE_URL, 
  max: 1,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

const run = async () => {
  console.log("🚀 Starting database migration...");
  console.log(`📁 Loading schema from: ${schemaPath}`);
  
  const client = await pool.connect();
  try {
    await client.query(schemaSql);
    console.log("✅ Schema applied successfully.");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.detail) {
      console.error("   Detail:", error.detail);
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
