const { query } = require("../../db");

// =====================
// Batch Insert Operations
// =====================

/**
 * Insert multiple guests in a batch operation
 * @param {string} projectId - Project ID for couple users
 * @param {Array} guests - Array of guest objects to insert
 * @returns {Promise<Array>} Array of inserted guest IDs
 */
const insertGuestsBatch = async (projectId, guests) => {
  if (!guests || guests.length === 0) {
    return [];
  }

  const insertedIds = [];
  
  // Use a transaction for data consistency
  const { transaction } = require("../../db");
  
  await transaction(async (queryFn) => {
    for (const guest of guests) {
      // Parse name into first_name and last_name
      const nameParts = parseName(guest.name || "");
      
      // Insert guest
      const guestResult = await queryFn(
        `INSERT INTO guests (project_id, group_id, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [
          projectId,
          guest.group_id || null,
          nameParts.firstName,
          nameParts.lastName,
          guest.role || null
        ]
      );
      
      const guestId = guestResult.rows[0]?.id;
      
      if (guestId) {
        // Insert contact info if provided
        if (guest.email || guest.phone) {
          await queryFn(
            `INSERT INTO guest_contacts (guest_id, email, phone)
             VALUES ($1, $2, $3)`,
            [guestId, guest.email || null, guest.phone || null]
          );
        }
        
        // Insert dietary restrictions as a tag if provided
        if (guest.dietary_restrictions && guest.dietary_restrictions.trim() !== "") {
          // Check if tag exists, create if not
          const tagResult = await queryFn(
            `INSERT INTO guest_tags (project_id, name)
             VALUES ($1, $2)
             ON CONFLICT (project_id, name) DO UPDATE SET name = $2
             RETURNING id`,
            [projectId, `Dietary: ${guest.dietary_restrictions}`]
          );
          
          const tagId = tagResult.rows[0]?.id;
          if (tagId) {
            await queryFn(
              `INSERT INTO guest_tag_assignments (guest_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [guestId, tagId]
            );
          }
        }
        
        // Handle plus_one flag
        if (guest.plus_one === true || guest.plus_one === "true" || guest.plus_one === "yes") {
          const plusOneResult = await queryFn(
            `INSERT INTO guest_tags (project_id, name)
             VALUES ($1, 'Plus One')
             ON CONFLICT (project_id, name) DO UPDATE SET name = 'Plus One'
             RETURNING id`,
            [projectId]
          );
          
          const plusOneTagId = plusOneResult.rows[0]?.id;
          if (plusOneTagId) {
            await queryFn(
              `INSERT INTO guest_tag_assignments (guest_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [guestId, plusOneTagId]
            );
          }
        }
        
        insertedIds.push(guestId);
      }
    }
  });
  
  return insertedIds;
};

/**
 * Insert multiple clients in a batch operation
 * @param {string} organizationId - Organization ID for business users
 * @param {Array} clients - Array of client objects to insert
 * @returns {Promise<Array>} Array of inserted client IDs
 */
const insertClientsBatch = async (organizationId, clients) => {
  if (!clients || clients.length === 0) {
    return [];
  }

  const insertedIds = [];
  
  // Use a transaction for data consistency
  const { transaction } = require("../../db");
  
  await transaction(async (queryFn) => {
    for (const client of clients) {
      const result = await queryFn(
        `INSERT INTO clients 
         (organization_id, name, email, phone, address, type, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id`,
        [
          organizationId,
          client.name,
          client.email || null,
          client.phone || null,
          client.address || null,
          client.type || null,
          client.status || "active",
          client.notes || null
        ]
      );
      
      const clientId = result.rows[0]?.id;
      if (clientId) {
        insertedIds.push(clientId);
      }
    }
  });
  
  return insertedIds;
};

/**
 * Check for existing guests by email or phone in a project (duplicate detection)
 * @param {string} projectId - Project ID
 * @param {Array} guests - Array of guest objects with email/phone
 * @returns {Promise<Array>} Array of potential duplicates
 */
const checkExistingGuests = async (projectId, guests) => {
  const emails = guests
    .filter(g => g.email && g.email.trim() !== "")
    .map(g => g.email.toLowerCase().trim());
  
  const phones = guests
    .filter(g => g.phone && g.phone.trim() !== "")
    .map(g => g.phone.trim());
  
  if (emails.length === 0 && phones.length === 0) {
    return [];
  }
  
  let sql = `
    SELECT DISTINCT g.id, g.first_name, g.last_name, gc.email, gc.phone
    FROM guests g
    LEFT JOIN guest_contacts gc ON gc.guest_id = g.id
    WHERE g.project_id = $1
    AND (
  `;
  
  const params = [projectId];
  let paramIdx = 2;
  const conditions = [];
  
  if (emails.length > 0) {
    conditions.push(`LOWER(gc.email) = ANY($${paramIdx}::text[])`);
    params.push(emails);
    paramIdx++;
  }
  
  if (phones.length > 0) {
    conditions.push(`gc.phone = ANY($${paramIdx}::text[])`);
    params.push(phones);
    paramIdx++;
  }
  
  sql += conditions.join(" OR ");
  sql += ")";
  
  const result = await query(sql, params);
  return result.rows;
};

/**
 * Check for existing clients by email or phone in an organization (duplicate detection)
 * @param {string} organizationId - Organization ID
 * @param {Array} clients - Array of client objects with email/phone
 * @returns {Promise<Array>} Array of potential duplicates
 */
const checkExistingClients = async (organizationId, clients) => {
  const emails = clients
    .filter(c => c.email && c.email.trim() !== "")
    .map(c => c.email.toLowerCase().trim());
  
  const phones = clients
    .filter(c => c.phone && c.phone.trim() !== "")
    .map(c => c.phone.trim());
  
  if (emails.length === 0 && phones.length === 0) {
    return [];
  }
  
  let sql = `
    SELECT id, name, email, phone
    FROM clients
    WHERE organization_id = $1
    AND (
  `;
  
  const params = [organizationId];
  let paramIdx = 2;
  const conditions = [];
  
  if (emails.length > 0) {
    conditions.push(`LOWER(email) = ANY($${paramIdx}::text[])`);
    params.push(emails);
    paramIdx++;
  }
  
  if (phones.length > 0) {
    conditions.push(`phone = ANY($${paramIdx}::text[])`);
    params.push(phones);
    paramIdx++;
  }
  
  sql += conditions.join(" OR ");
  sql += ")";
  
  const result = await query(sql, params);
  return result.rows;
};

// =====================
// Helper Functions
// =====================

/**
 * Parse a full name into first and last name
 * @param {string} fullName - Full name string
 * @returns {Object} Object with firstName and lastName
 */
function parseName(fullName) {
  if (!fullName || fullName.trim() === "") {
    return { firstName: "", lastName: "" };
  }
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  
  const lastName = parts.pop();
  const firstName = parts.join(" ");
  
  return { firstName, lastName };
}

module.exports = {
  insertGuestsBatch,
  insertClientsBatch,
  checkExistingGuests,
  checkExistingClients
};
