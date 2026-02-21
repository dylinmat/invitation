/**
 * Clients API Client
 * Client management and notes API operations
 */

import { api } from "../api";

// ====================
// Types
// ====================

/**
 * Client entity
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  createdAt: string;
  updatedAt: string;
}

/**
 * Client note entity
 */
export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client event summary
 */
export interface ClientEvent {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
  budget: number;
}

/**
 * Filters for client list queries
 */
export interface ClientFilters {
  status?: 'active' | 'inactive' | 'prospect';
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Data required to create a new client
 */
export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'prospect';
}

/**
 * Data for updating a client
 */
export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'prospect';
}

/**
 * Data for creating a client note
 */
export interface CreateNoteData {
  content: string;
}

/**
 * Paginated clients response
 */
export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
}

// ====================
// Clients API
// ====================

/**
 * Get a list of clients with optional filters
 * @param filters - Query filters for pagination, status, search, etc.
 * @returns Promise with paginated clients
 */
export async function getClients(filters?: ClientFilters): Promise<ClientsResponse> {
  return api.get<ClientsResponse>("/clients", filters);
}

/**
 * Get a single client by ID
 * @param id - Client ID
 * @returns Promise with client details
 */
export async function getClient(id: string): Promise<Client> {
  return api.get<Client>(`/clients/${id}`);
}

/**
 * Create a new client
 * @param data - Client creation data
 * @returns Promise with created client
 */
export async function createClient(data: CreateClientData): Promise<Client> {
  return api.post<Client>("/clients", data);
}

/**
 * Update an existing client
 * @param id - Client ID
 * @param data - Client update data
 * @returns Promise with updated client
 */
export async function updateClient(id: string, data: UpdateClientData): Promise<Client> {
  return api.patch<Client>(`/clients/${id}`, data);
}

/**
 * Delete a client
 * @param id - Client ID
 * @returns Promise that resolves when deleted
 */
export async function deleteClient(id: string): Promise<void> {
  return api.delete<void>(`/clients/${id}`);
}

// ====================
// Client Events API
// ====================

/**
 * Get all events associated with a client
 * @param clientId - Client ID
 * @returns Promise with array of client events
 */
export async function getClientEvents(clientId: string): Promise<ClientEvent[]> {
  return api.get<ClientEvent[]>(`/clients/${clientId}/events`);
}

// ====================
// Client Notes API
// ====================

/**
 * Get all notes for a specific client
 * @param clientId - Client ID
 * @returns Promise with array of notes
 */
export async function getClientNotes(clientId: string): Promise<ClientNote[]> {
  return api.get<ClientNote[]>(`/clients/${clientId}/notes`);
}

/**
 * Create a new note for a client
 * @param clientId - Client ID
 * @param data - Note creation data
 * @returns Promise with created note
 */
export async function createClientNote(
  clientId: string,
  data: CreateNoteData
): Promise<ClientNote> {
  return api.post<ClientNote>(`/clients/${clientId}/notes`, data);
}

/**
 * Update an existing client note
 * @param clientId - Client ID
 * @param noteId - Note ID
 * @param data - Note update data
 * @returns Promise with updated note
 */
export async function updateClientNote(
  clientId: string,
  noteId: string,
  data: CreateNoteData
): Promise<ClientNote> {
  return api.patch<ClientNote>(`/clients/${clientId}/notes/${noteId}`, data);
}

/**
 * Delete a client note
 * @param clientId - Client ID
 * @param noteId - Note ID
 * @returns Promise that resolves when deleted
 */
export async function deleteClientNote(clientId: string, noteId: string): Promise<void> {
  return api.delete<void>(`/clients/${clientId}/notes/${noteId}`);
}

// ====================
// Clients API Object
// ====================

/**
 * Clients API object - alternative way to access client operations
 */
export const clientsApi = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  events: {
    getClientEvents,
  },
  notes: {
    getClientNotes,
    createClientNote,
    updateClientNote,
    deleteClientNote,
  },
};

export default clientsApi;
