const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/eios";

// PostgreSQL pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

class Persistence {
  constructor() {
    this.pool = pool;
  }

  /**
   * Load scene graph from site_versions table
   */
  async loadSceneGraph(siteId, version) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, scene_graph 
         FROM site_versions 
         WHERE site_id = $1 AND version = $2`,
        [siteId, parseInt(version, 10)]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        versionId: row.id,
        sceneGraph: row.scene_graph || this.getDefaultSceneGraph(),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Save scene graph to site_versions table
   */
  async saveSceneGraph(siteId, version, sceneGraph) {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE site_versions 
         SET scene_graph = $1, updated_at = NOW()
         WHERE site_id = $2 AND version = $3`,
        [JSON.stringify(sceneGraph), siteId, parseInt(version, 10)]
      );
      return true;
    } catch (err) {
      console.error("Failed to save scene graph:", err.message);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get site version ID
   */
  async getSiteVersionId(siteId, version) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id FROM site_versions WHERE site_id = $1 AND version = $2`,
        [siteId, parseInt(version, 10)]
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get default empty scene graph
   */
  getDefaultSceneGraph() {
    return {
      version: 1,
      canvas: { width: 1440, height: 900, background: "#ffffff" },
      assets: {
        images: {},
        fonts: {},
      },
      nodes: [],
      components: [],
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Close pool
   */
  async close() {
    await this.pool.end();
  }
}

// Singleton instance
const persistence = new Persistence();

module.exports = { Persistence, persistence };
