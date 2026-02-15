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
  console.error("❌ DATABASE_URL is required for seeding.");
  console.error("   Set DATABASE_URL environment variable or create .env.railway file.");
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: DATABASE_URL, 
  max: 1,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Initial plans data
const plans = [
  {
    code: "FREE",
    name: "Free",
    entitlements: {
      max_projects: 1,
      max_events_per_project: 1,
      max_guests_per_project: 50,
      max_sites_per_project: 1,
      max_storage_mb: 100,
      custom_domain: false,
      advanced_rsvp_logic: false,
      messaging_enabled: false,
      analytics_enabled: false,
      support_level: "community"
    }
  },
  {
    code: "STARTER",
    name: "Starter",
    entitlements: {
      max_projects: 3,
      max_events_per_project: 5,
      max_guests_per_project: 200,
      max_sites_per_project: 2,
      max_storage_mb: 1000,
      custom_domain: true,
      advanced_rsvp_logic: false,
      messaging_enabled: true,
      analytics_enabled: true,
      support_level: "email"
    }
  },
  {
    code: "PROFESSIONAL",
    name: "Professional",
    entitlements: {
      max_projects: 10,
      max_events_per_project: 20,
      max_guests_per_project: 1000,
      max_sites_per_project: 5,
      max_storage_mb: 10000,
      custom_domain: true,
      advanced_rsvp_logic: true,
      messaging_enabled: true,
      analytics_enabled: true,
      support_level: "priority"
    }
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    entitlements: {
      max_projects: null,
      max_events_per_project: null,
      max_guests_per_project: null,
      max_sites_per_project: null,
      max_storage_mb: null,
      custom_domain: true,
      advanced_rsvp_logic: true,
      messaging_enabled: true,
      analytics_enabled: true,
      support_level: "dedicated"
    }
  }
];

// Settings definitions
const settingsDefinitions = [
  // Platform-level settings
  {
    key: "platform.registration_enabled",
    value_type: "BOOLEAN",
    default_value: true,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "PLATFORM",
    scope_max: "PLATFORM",
    description: "Allow new user registrations",
    is_public: true
  },
  {
    key: "platform.maintenance_mode",
    value_type: "BOOLEAN",
    default_value: false,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "PLATFORM",
    scope_max: "PLATFORM",
    description: "Enable maintenance mode",
    is_public: true
  },
  // Plan-level settings
  {
    key: "plan.allow_custom_branding",
    value_type: "BOOLEAN",
    default_value: false,
    allowed_values: null,
    entitlements_key: "custom_branding",
    entitlements_values: JSON.stringify([true]),
    scope_min: "PLAN",
    scope_max: "PLAN",
    description: "Allow custom branding for sites",
    is_public: true
  },
  // Organization-level settings
  {
    key: "org.default_timezone",
    value_type: "STRING",
    default_value: "UTC",
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "ORG",
    scope_max: "ORG",
    description: "Default timezone for organization",
    is_public: true
  },
  {
    key: "org.billing_email",
    value_type: "STRING",
    default_value: "",
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "ORG",
    scope_max: "ORG",
    description: "Billing contact email",
    is_public: false
  },
  // Project-level settings
  {
    key: "project.rsvp_deadline_days",
    value_type: "NUMBER",
    default_value: 14,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "PROJECT",
    scope_max: "PROJECT",
    description: "Default RSVP deadline in days before event",
    is_public: true
  },
  {
    key: "project.allow_plus_ones",
    value_type: "BOOLEAN",
    default_value: true,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "PROJECT",
    scope_max: "PROJECT",
    description: "Allow guests to bring plus ones",
    is_public: true
  },
  {
    key: "project.guest_self_service",
    value_type: "BOOLEAN",
    default_value: true,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "PROJECT",
    scope_max: "PROJECT",
    description: "Allow guests to update their own information",
    is_public: true
  },
  // Event-level settings
  {
    key: "event.max_guests",
    value_type: "NUMBER",
    default_value: null,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "EVENT",
    scope_max: "EVENT",
    description: "Maximum number of guests for this event",
    is_public: true
  },
  // Invite-level settings
  {
    key: "invite.require_rsvp_confirmation",
    value_type: "BOOLEAN",
    default_value: false,
    allowed_values: null,
    entitlements_key: null,
    entitlements_values: null,
    scope_min: "INVITE",
    scope_max: "INVITE",
    description: "Require email confirmation for RSVP",
    is_public: true
  }
];

const seedPlans = async (client) => {
  console.log("🌱 Seeding plans...");
  
  for (const plan of plans) {
    const existing = await client.query(
      "SELECT id FROM plans WHERE code = $1",
      [plan.code]
    );
    
    if (existing.rows.length > 0) {
      console.log(`   ⏭️  Plan ${plan.code} already exists, skipping...`);
      continue;
    }
    
    const planResult = await client.query(
      `INSERT INTO plans (code, name) VALUES ($1, $2) RETURNING id`,
      [plan.code, plan.name]
    );
    
    const planId = planResult.rows[0].id;
    
    // Insert entitlements
    for (const [key, value] of Object.entries(plan.entitlements)) {
      await client.query(
        `INSERT INTO plan_entitlements (plan_id, key, value_json) VALUES ($1, $2, $3)`,
        [planId, key, JSON.stringify(value)]
      );
    }
    
    console.log(`   ✅ Created plan: ${plan.code}`);
  }
};

const seedSettingsDefinitions = async (client) => {
  console.log("🌱 Seeding settings definitions...");
  
  for (const def of settingsDefinitions) {
    const existing = await client.query(
      "SELECT id FROM settings_definitions WHERE key = $1",
      [def.key]
    );
    
    if (existing.rows.length > 0) {
      console.log(`   ⏭️  Setting ${def.key} already exists, skipping...`);
      continue;
    }
    
    await client.query(
      `INSERT INTO settings_definitions 
       (key, value_type, default_value, allowed_values, entitlements_key, entitlements_values, scope_min, scope_max, description, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        def.key,
        def.value_type,
        JSON.stringify(def.default_value),
        def.allowed_values ? JSON.stringify(def.allowed_values) : null,
        def.entitlements_key,
        def.entitlements_values,
        def.scope_min,
        def.scope_max,
        def.description,
        def.is_public
      ]
    );
    
    console.log(`   ✅ Created setting: ${def.key}`);
  }
};

const run = async () => {
  console.log("🚀 Starting database seeding...");
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    await seedPlans(client);
    await seedSettingsDefinitions(client);
    
    await client.query("COMMIT");
    console.log("\n✅ Seeding completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seeding failed:", error.message);
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
