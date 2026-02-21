/**
 * Invoices Service
 * Business logic for invoice management
 */

const {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceItems,
  getNextInvoiceNumber,
  invoiceNumberExists,
  markInvoiceSent,
  markInvoicePaid,
  hasInvoiceAccess
} = require("./repository");

const { getOrganizationMember } = require("../auth/repository");

// ============== Validation ==============

const VALID_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

const validateInvoiceData = (data) => {
  const errors = [];

  // Validate client ID
  if (data.clientId !== undefined && !data.clientId) {
    errors.push("Client ID is required");
  }

  // Validate due date
  if (data.dueDate !== undefined) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push("Invalid due date format");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        errors.push("Due date must be today or in the future");
      }
    }
  }

  // Validate items
  if (data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.push("At least one item is required");
    } else {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.description || typeof item.description !== "string") {
          errors.push(`Item ${i + 1}: Description is required`);
        }
        if (typeof item.quantity !== "number" || item.quantity <= 0) {
          errors.push(`Item ${i + 1}: Quantity must be a positive number`);
        }
        if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
          errors.push(`Item ${i + 1}: Unit price must be a non-negative number`);
        }
      }
    }
  }

  // Validate status
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return errors;
};

// ============== Calculation ==============

const calculateInvoiceTotals = (items, taxRate = 0) => {
  const amount = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + itemTotal;
  }, 0);

  const taxAmount = taxRate > 0 ? amount * (taxRate / 100) : 0;
  const totalAmount = amount + taxAmount;

  return {
    amount: parseFloat(amount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

// ============== Access Control ==============

const requireInvoiceAccess = async (userId, invoiceId) => {
  const hasAccess = await hasInvoiceAccess(invoiceId, userId);
  if (!hasAccess) {
    throw new Error("Access denied: You do not have access to this invoice");
  }
  return true;
};

// ============== Invoice Service Methods ==============

/**
 * List invoices for an organization
 */
const listOrganizationInvoices = async (userId, organizationId, filters = {}) => {
  // Verify user is org member
  const membership = await getOrganizationMember(organizationId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  const { invoices, total, page, limit } = await listInvoices(organizationId, filters);

  return {
    invoices: invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client_id,
      clientName: inv.client_name,
      clientEmail: inv.client_email,
      amount: parseFloat(inv.amount),
      taxAmount: parseFloat(inv.tax_amount),
      totalAmount: parseFloat(inv.total_amount),
      status: inv.status,
      dueDate: inv.due_date,
      paidAt: inv.paid_at,
      sentAt: inv.sent_at,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at
    })),
    total,
    page,
    limit
  };
};

/**
 * Get single invoice with items
 */
const getInvoice = async (userId, invoiceId, organizationId) => {
  await requireInvoiceAccess(userId, invoiceId);

  const invoice = await getInvoiceById(invoiceId, organizationId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client_id,
    client: invoice.client_id ? {
      id: invoice.client_id,
      name: invoice.client_name,
      email: invoice.client_email,
      phone: invoice.client_phone,
      address: invoice.client_address
    } : null,
    amount: parseFloat(invoice.amount),
    taxAmount: parseFloat(invoice.tax_amount),
    totalAmount: parseFloat(invoice.total_amount),
    description: invoice.description,
    status: invoice.status,
    dueDate: invoice.due_date,
    paidAt: invoice.paid_at,
    sentAt: invoice.sent_at,
    items: invoice.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      total: parseFloat(item.total)
    })),
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at
  };
};

/**
 * Create new invoice
 */
const createNewInvoice = async (userId, organizationId, data) => {
  // Verify user is org member
  const membership = await getOrganizationMember(organizationId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  // Validate input
  const errors = validateInvoiceData(data);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  // Calculate totals from items
  const items = data.items.map(item => ({
    ...item,
    total: parseFloat((item.quantity * item.unitPrice).toFixed(2))
  }));

  const { amount, taxAmount, totalAmount } = calculateInvoiceTotals(items, data.taxRate);

  // Generate invoice number
  const invoiceNumber = await getNextInvoiceNumber(organizationId);

  // Create invoice
  const invoice = await createInvoice({
    organizationId,
    clientId: data.clientId,
    invoiceNumber,
    amount,
    taxAmount,
    totalAmount,
    description: data.description,
    status: "draft",
    dueDate: data.dueDate,
    items
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client_id,
    amount: parseFloat(invoice.amount),
    taxAmount: parseFloat(invoice.tax_amount),
    totalAmount: parseFloat(invoice.total_amount),
    description: invoice.description,
    status: invoice.status,
    dueDate: invoice.due_date,
    createdAt: invoice.created_at
  };
};

/**
 * Update invoice
 */
const updateInvoiceDetails = async (userId, invoiceId, organizationId, updates) => {
  await requireInvoiceAccess(userId, invoiceId);

  // Get current invoice
  const currentInvoice = await getInvoiceById(invoiceId, organizationId);
  if (!currentInvoice) {
    throw new Error("Invoice not found");
  }

  // Only drafts can be edited (unless just changing status)
  const allowedStatusesForEdit = ["draft", "sent"];
  if (!allowedStatusesForEdit.includes(currentInvoice.status)) {
    throw new Error(`Cannot edit invoice with status: ${currentInvoice.status}`);
  }

  // Validate input
  const errors = validateInvoiceData(updates);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  // If items are being updated, recalculate totals
  let amount, taxAmount, totalAmount;
  if (updates.items) {
    const items = updates.items.map(item => ({
      ...item,
      total: parseFloat((item.quantity * item.unitPrice).toFixed(2))
    }));

    const totals = calculateInvoiceTotals(items, updates.taxRate || 0);
    amount = totals.amount;
    taxAmount = totals.taxAmount;
    totalAmount = totals.totalAmount;

    // Update items
    await updateInvoiceItems(invoiceId, items);
  }

  // Build update object
  const updateData = {};
  if (updates.clientId !== undefined) updateData.clientId = updates.clientId;
  if (amount !== undefined) updateData.amount = amount;
  if (taxAmount !== undefined) updateData.taxAmount = taxAmount;
  if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;

  const invoice = await updateInvoice(invoiceId, updateData);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client_id,
    amount: parseFloat(invoice.amount),
    taxAmount: parseFloat(invoice.tax_amount),
    totalAmount: parseFloat(invoice.total_amount),
    description: invoice.description,
    status: invoice.status,
    dueDate: invoice.due_date,
    updatedAt: invoice.updated_at
  };
};

/**
 * Delete invoice (only drafts)
 */
const removeInvoice = async (userId, invoiceId, organizationId) => {
  await requireInvoiceAccess(userId, invoiceId);

  // Get current invoice to check status
  const currentInvoice = await getInvoiceById(invoiceId, organizationId);
  if (!currentInvoice) {
    throw new Error("Invoice not found");
  }

  if (currentInvoice.status !== "draft") {
    throw new Error(`Cannot delete invoice with status: ${currentInvoice.status}. Only draft invoices can be deleted.`);
  }

  await deleteInvoice(invoiceId);
  return { id: invoiceId, deleted: true };
};

/**
 * Send invoice (mark as sent and log)
 */
const sendInvoice = async (userId, invoiceId, organizationId) => {
  await requireInvoiceAccess(userId, invoiceId);

  const invoice = await getInvoiceById(invoiceId, organizationId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status !== "draft") {
    throw new Error(`Invoice cannot be sent. Current status: ${invoice.status}`);
  }

  // Mark as sent
  const updatedInvoice = await markInvoiceSent(invoiceId);

  // TODO: Actually send email (currently just logging)
  console.log(`[Invoice Email] Invoice ${updatedInvoice.invoice_number} sent to client ${invoice.client_email}`);

  return {
    id: updatedInvoice.id,
    invoiceNumber: updatedInvoice.invoice_number,
    status: updatedInvoice.status,
    sentAt: updatedInvoice.sent_at,
    message: "Invoice marked as sent"
  };
};

/**
 * Mark invoice as paid
 */
const payInvoice = async (userId, invoiceId, organizationId) => {
  await requireInvoiceAccess(userId, invoiceId);

  const invoice = await getInvoiceById(invoiceId, organizationId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "paid") {
    throw new Error("Invoice is already marked as paid");
  }

  if (invoice.status === "cancelled") {
    throw new Error("Cannot mark cancelled invoice as paid");
  }

  const updatedInvoice = await markInvoicePaid(invoiceId);

  return {
    id: updatedInvoice.id,
    invoiceNumber: updatedInvoice.invoice_number,
    status: updatedInvoice.status,
    paidAt: updatedInvoice.paid_at,
    message: "Invoice marked as paid"
  };
};

/**
 * Get next invoice number preview
 */
const getNextNumber = async (userId, organizationId) => {
  // Verify user is org member
  const membership = await getOrganizationMember(organizationId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  const nextNumber = await getNextInvoiceNumber(organizationId);
  return { nextNumber };
};

module.exports = {
  // Invoice CRUD
  listOrganizationInvoices,
  getInvoice,
  createNewInvoice,
  updateInvoiceDetails,
  removeInvoice,
  
  // Actions
  sendInvoice,
  payInvoice,
  getNextNumber,
  
  // Utilities
  calculateInvoiceTotals,
  validateInvoiceData
};
