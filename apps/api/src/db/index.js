const { Pool } = require("pg");
const { DATABASE_URL } = require("../config");

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database access is disabled.");
}

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, max: 10 })
  : null;

const query = async (text, params) => {
  if (!pool) {
    throw new Error("Database not configured");
  }
  return pool.query(text, params);
};

module.exports = {
  pool,
  query
};
