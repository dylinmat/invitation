/**
 * Invoices API Client
 * Invoice management and billing API operations
 */

import { api } from "../api";

// ====================
// Types
// ====================

/**
 * Invoice status values
 */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Invoice entity
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  eventId?: string;
  eventName?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  lineItems: InvoiceLineItem[];
  paidAt?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Filters for invoice list queries
 */
export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  eventId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Data for creating a new line item
 */
export interface CreateLineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Data required to create a new invoice
 */
export interface CreateInvoiceData {
  clientId: string;
  eventId?: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  lineItems: CreateLineItemData[];
  taxRate?: number;
  notes?: string;
}

/**
 * Data for updating an invoice
 */
export interface UpdateInvoiceData {
  clientId?: string;
  eventId?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: CreateLineItemData[];
  taxRate?: number;
  notes?: string;
  status?: InvoiceStatus;
}

/**
 * Paginated invoices response
 */
export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

/**
 * Invoice number response
 */
export interface InvoiceNumberResponse {
  nextInvoiceNumber: string;
}

/**
 * Send invoice response
 */
export interface SendInvoiceResponse {
  success: boolean;
  sentAt: string;
  message: string;
}

/**
 * Mark as paid data
 */
export interface MarkAsPaidData {
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

/**
 * Mark as paid response
 */
export interface MarkAsPaidResponse {
  success: boolean;
  invoice: Invoice;
}

// ====================
// Invoices API
// ====================

/**
 * Get a list of invoices with optional filters
 * @param filters - Query filters for pagination, status, dates, etc.
 * @returns Promise with paginated invoices
 */
export async function getInvoices(filters?: InvoiceFilters): Promise<InvoicesResponse> {
  return api.get<InvoicesResponse>("/invoices", filters);
}

/**
 * Get a single invoice by ID
 * @param id - Invoice ID
 * @returns Promise with invoice details
 */
export async function getInvoice(id: string): Promise<Invoice> {
  return api.get<Invoice>(`/invoices/${id}`);
}

/**
 * Create a new invoice
 * @param data - Invoice creation data
 * @returns Promise with created invoice
 */
export async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  return api.post<Invoice>("/invoices", data);
}

/**
 * Update an existing invoice
 * @param id - Invoice ID
 * @param data - Invoice update data
 * @returns Promise with updated invoice
 */
export async function updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
  return api.patch<Invoice>(`/invoices/${id}`, data);
}

/**
 * Delete an invoice
 * @param id - Invoice ID
 * @returns Promise that resolves when deleted
 */
export async function deleteInvoice(id: string): Promise<void> {
  return api.delete<void>(`/invoices/${id}`);
}

// ====================
// Invoice Actions API
// ====================

/**
 * Send an invoice to the client
 * @param id - Invoice ID
 * @returns Promise with send confirmation
 */
export async function sendInvoice(id: string): Promise<SendInvoiceResponse> {
  return api.post<SendInvoiceResponse>(`/invoices/${id}/send`);
}

/**
 * Mark an invoice as paid
 * @param id - Invoice ID
 * @param data - Optional payment details
 * @returns Promise with updated invoice
 */
export async function markInvoicePaid(
  id: string,
  data?: MarkAsPaidData
): Promise<MarkAsPaidResponse> {
  return api.post<MarkAsPaidResponse>(`/invoices/${id}/mark-paid`, data);
}

/**
 * Get the next available invoice number
 * @returns Promise with next invoice number
 */
export async function getNextInvoiceNumber(): Promise<InvoiceNumberResponse> {
  return api.get<InvoiceNumberResponse>("/invoices/next-number");
}

/**
 * Duplicate an existing invoice
 * @param id - Invoice ID to duplicate
 * @returns Promise with new invoice
 */
export async function duplicateInvoice(id: string): Promise<Invoice> {
  return api.post<Invoice>(`/invoices/${id}/duplicate`);
}

/**
 * Cancel an invoice
 * @param id - Invoice ID
 * @returns Promise with cancelled invoice
 */
export async function cancelInvoice(id: string): Promise<Invoice> {
  return api.post<Invoice>(`/invoices/${id}/cancel`);
}

// ====================
// Invoices API Object
// ====================

/**
 * Invoices API object - alternative way to access invoice operations
 */
export const invoicesApi = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  markInvoicePaid,
  getNextInvoiceNumber,
  duplicateInvoice,
  cancelInvoice,
};

export default invoicesApi;
