/**
 * Invoices Repository
 * Database queries for invoice management
 */

const { query, queryOne, queryMany, transaction } = require("../../db");

// ============== Invoice CRUD ==============

/**
 * List invoices with filters and pagination
 */
const listInvoices = async (organizationId, { status, clientId, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ["organization_id = $1"];
  const params = [organizationId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (clientId) {
    conditions.push(`client_id = $${paramIndex}`);
    params.push(clientId);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM invoices WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Get invoices with client info
  const invoicesResult = await query(
    `SELECT i.*, 
            c.id as client_id, c.name as client_name, c.email as client_email
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     WHERE ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    invoices: invoicesResult.rows,
    total,
    page,
    limit
  };
};

/**
 * Get invoice by ID with items and client details
 */
const getInvoiceById = async (id, organizationId) => {
  const invoice = await queryOne(
    `SELECT i.*,
            c.id as client_id, c.name as client_name, c.email as client_email,
            c.phone as client_phone, c.address as client_address
     FROM invoices i
     LEFT JOIN clients c ON i.client_id = c.id
     WHERE i.id = $1 AND i.organization_id = $2`,
    [id, organizationId]
  );

  if (!invoice) return null;

  // Get invoice items
  const items = await queryMany(
    `SELECT id, description, quantity, unit_price, total
     FROM invoice_items
     WHERE invoice_id = $1
     ORDER BY id ASC`,
    [id]
  );

  return {
    ...invoice,
    items
  };
};

/**
 * Get invoice by ID (internal use, no org check)
 */
const getInvoiceByIdInternal = async (id) => {
  return await queryOne(
    `SELECT * FROM invoices WHERE id = $1`,
    [id]
  );
};

/**
 * Create a new invoice with items
 */
const createInvoice = async (data) => {
  const {
    organizationId,
    clientId,
    invoiceNumber,
    amount,
    taxAmount,
    totalAmount,
    description,
    status = 'draft',
    dueDate,
    items
  } = data;

  return await transaction(async (queryFn) => {
    // Create invoice
    const invoiceResult = await queryFn(
      `INSERT INTO invoices (
        organization_id, client_id, invoice_number, amount, tax_amount, 
        total_amount, description, status, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [organizationId, clientId, invoiceNumber, amount, taxAmount, totalAmount, description, status, dueDate]
    );

    const invoice = invoiceResult.rows[0];

    // Create invoice items
    if (items && items.length > 0) {
      for (const item of items) {
        await queryFn(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoice.id, item.description, item.quantity, item.unitPrice, item.total]
        );
      }
    }

    return invoice;
  });
};

/**
 * Update invoice
 */
const updateInvoice = async (id, updates) => {
  const allowedFields = {
    clientId: "client_id",
    amount: "amount",
    taxAmount: "tax_amount",
    totalAmount: "total_amount",
    description: "description",
    status: "status",
    dueDate: "due_date",
    paidAt: "paid_at",
    sentAt: "sent_at"
  };

  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbColumn = allowedFields[key];
    if (dbColumn && value !== undefined) {
      fields.push(`${dbColumn} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return getInvoiceByIdInternal(id);
  }

  fields.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE invoices SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    [...values, id]
  );

  return result.rows[0] || null;
};

/**
 * Delete invoice (only allowed for drafts)
 */
const deleteInvoice = async (id) => {
  return await transaction(async (queryFn) => {
    // Delete items first (cascade should handle this, but being explicit)
    await queryFn(
      `DELETE FROM invoice_items WHERE invoice_id = $1`,
      [id]
    );

    // Delete invoice
    const result = await queryFn(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [id]
    );

    return result.rows[0] || null;
  });
};

/**
 * Update invoice items (replace all items)
 */
const updateInvoiceItems = async (invoiceId, items) => {
  return await transaction(async (queryFn) => {
    // Delete existing items
    await queryFn(
      `DELETE FROM invoice_items WHERE invoice_id = $1`,
      [invoiceId]
    );

    // Insert new items
    for (const item of items) {
      await queryFn(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, item.description, item.quantity, item.unitPrice, item.total]
      );
    }
  });
};

// ============== Invoice Number Generation ==============

/**
 * Get the next invoice number for an organization
 * Format: INV-YYYY-XXXXX (e.g., INV-2024-00001)
 */
const getNextInvoiceNumber = async (organizationId) => {
  const year = new Date().getFullYear();
  
  const result = await query(
    `SELECT COUNT(*) as count FROM invoices 
     WHERE organization_id = $1 AND invoice_number LIKE $2`,
    [organizationId, `INV-${year}-%`]
  );
  
  const nextNum = String(parseInt(result.rows[0].count) + 1).padStart(5, '0');
  return `INV-${year}-${nextNum}`;
};

/**
 * Check if invoice number already exists
 */
const invoiceNumberExists = async (invoiceNumber, excludeId = null) => {
  const query_text = excludeId 
    ? `SELECT 1 FROM invoices WHERE invoice_number = $1 AND id != $2 LIMIT 1`
    : `SELECT 1 FROM invoices WHERE invoice_number = $1 LIMIT 1`;
  const params = excludeId ? [invoiceNumber, excludeId] : [invoiceNumber];
  
  const result = await query(query_text, params);
  return result.rows.length > 0;
};

// ============== Status Management ==============

/**
 * Mark invoice as sent
 */
const markInvoiceSent = async (id) => {
  const result = await query(
    `UPDATE invoices 
     SET status = 'sent', sent_at = NOW(), updated_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Mark invoice as paid
 */
const markInvoicePaid = async (id) => {
  const result = await query(
    `UPDATE invoices 
     SET status = 'paid', paid_at = NOW(), updated_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// ============== Access Control ==============

/**
 * Check if user has access to invoice (through organization)
 */
const hasInvoiceAccess = async (invoiceId, userId) => {
  const result = await query(
    `SELECT 1 
     FROM invoices i
     JOIN organization_members om ON i.organization_id = om.org_id
     WHERE i.id = $1 AND om.user_id = $2
     LIMIT 1`,
    [invoiceId, userId]
  );
  return result.rows.length > 0;
};

/**
 * Get invoice organization ID
 */
const getInvoiceOrganizationId = async (invoiceId) => {
  const result = await query(
    `SELECT organization_id FROM invoices WHERE id = $1`,
    [invoiceId]
  );
  return result.rows[0]?.organization_id || null;
};

module.exports = {
  // Invoice CRUD
  listInvoices,
  getInvoiceById,
  getInvoiceByIdInternal,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  
  // Items
  updateInvoiceItems,
  
  // Invoice Number
  getNextInvoiceNumber,
  invoiceNumberExists,
  
  // Status Management
  markInvoiceSent,
  markInvoicePaid,
  
  // Access Control
  hasInvoiceAccess,
  getInvoiceOrganizationId
};
