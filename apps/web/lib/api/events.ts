/**
 * Events API Client
 * Event and task management API operations
 */

import { api } from "../api";

// ====================
// Types
// ====================

/**
 * Event status values
 */
export type EventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Task status values
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Event entity
 */
export interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  budget: number;
  status: EventStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task entity
 */
export interface Task {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
}

/**
 * Filters for event list queries
 */
export interface EventFilters {
  status?: EventStatus;
  type?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Data required to create a new event
 */
export interface CreateEventData {
  name: string;
  type: string;
  date: string;
  location: string;
  budget?: number;
  status?: EventStatus;
  description?: string;
}

/**
 * Data for updating an event
 */
export interface UpdateEventData {
  name?: string;
  type?: string;
  date?: string;
  location?: string;
  budget?: number;
  status?: EventStatus;
  description?: string;
}

/**
 * Data required to create a new task
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
}

/**
 * Data for updating a task
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
}

/**
 * Paginated events response
 */
export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

// ====================
// Events API
// ====================

/**
 * Get a list of events with optional filters
 * @param filters - Query filters for pagination, status, dates, etc.
 * @returns Promise with paginated events
 */
export async function getEvents(filters?: EventFilters): Promise<EventsResponse> {
  return api.get<EventsResponse>("/events", filters);
}

/**
 * Get a single event by ID
 * @param id - Event ID
 * @returns Promise with event details
 */
export async function getEvent(id: string): Promise<Event> {
  return api.get<Event>(`/events/${id}`);
}

/**
 * Create a new event
 * @param data - Event creation data
 * @returns Promise with created event
 */
export async function createEvent(data: CreateEventData): Promise<Event> {
  return api.post<Event>("/events", data);
}

/**
 * Update an existing event
 * @param id - Event ID
 * @param data - Event update data
 * @returns Promise with updated event
 */
export async function updateEvent(id: string, data: UpdateEventData): Promise<Event> {
  return api.patch<Event>(`/events/${id}`, data);
}

/**
 * Delete an event
 * @param id - Event ID
 * @returns Promise that resolves when deleted
 */
export async function deleteEvent(id: string): Promise<void> {
  return api.delete<void>(`/events/${id}`);
}

// ====================
// Tasks API
// ====================

/**
 * Get all tasks for a specific event
 * @param eventId - Event ID
 * @returns Promise with array of tasks
 */
export async function getEventTasks(eventId: string): Promise<Task[]> {
  return api.get<Task[]>(`/events/${eventId}/tasks`);
}

/**
 * Create a new task for an event
 * @param eventId - Event ID
 * @param data - Task creation data
 * @returns Promise with created task
 */
export async function createTask(eventId: string, data: CreateTaskData): Promise<Task> {
  return api.post<Task>(`/events/${eventId}/tasks`, data);
}

/**
 * Update an existing task
 * @param eventId - Event ID
 * @param taskId - Task ID
 * @param data - Task update data
 * @returns Promise with updated task
 */
export async function updateTask(
  eventId: string,
  taskId: string,
  data: UpdateTaskData
): Promise<Task> {
  return api.patch<Task>(`/events/${eventId}/tasks/${taskId}`, data);
}

/**
 * Delete a task
 * @param eventId - Event ID
 * @param taskId - Task ID
 * @returns Promise that resolves when deleted
 */
export async function deleteTask(eventId: string, taskId: string): Promise<void> {
  return api.delete<void>(`/events/${eventId}/tasks/${taskId}`);
}

// ====================
// Events API Object
// ====================

/**
 * Events API object - alternative way to access event operations
 */
export const eventsApi = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  tasks: {
    getEventTasks,
    createTask,
    updateTask,
    deleteTask,
  },
};

export default eventsApi;
