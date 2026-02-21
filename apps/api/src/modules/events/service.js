/**
 * Events Service - Business Logic Layer
 */

const {
  // Events
  findEventsByOrganization,
  findEventById,
  createEvent,
  updateEvent,
  deleteEvent,

  // Tasks
  findTasksByEvent,
  findTaskById,
  createTask,
  updateTask,
  deleteTask
} = require("./repository");

// Valid event statuses
const VALID_EVENT_STATUSES = ["planning", "confirmed", "in_progress", "completed", "cancelled"];

// Valid task statuses
const VALID_TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"];

// Valid task priorities
const VALID_TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

// Valid event types
const VALID_EVENT_TYPES = [
  "wedding",
  "corporate",
  "birthday",
  "conference",
  "party",
  "meeting",
  "workshop",
  "other"
];

// =====================
// Events Service
// =====================

/**
 * Get events for an organization with filters
 * @param {string} organizationId - Organization ID
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const getOrganizationEvents = async (organizationId, filters = {}) => {
  try {
    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    const result = await findEventsByOrganization(organizationId, filters);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get a single event by ID
 * @param {string} eventId - Event ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const getEvent = async (eventId, organizationId) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    const event = await findEventById(eventId, organizationId);

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    return {
      success: true,
      data: event
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new event
 * @param {Object} data - Event data
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const createNewEvent = async (data) => {
  try {
    const { organizationId, name, type, date, location, budget, status, description } = data;

    // Validation
    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return { success: false, error: "Event name is required" };
    }

    if (name.trim().length > 255) {
      return { success: false, error: "Event name must be 255 characters or less" };
    }

    if (type && !VALID_EVENT_TYPES.includes(type)) {
      return { success: false, error: `Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(", ")}` };
    }

    if (status && !VALID_EVENT_STATUSES.includes(status)) {
      return { success: false, error: `Invalid status. Valid statuses: ${VALID_EVENT_STATUSES.join(", ")}` };
    }

    if (budget !== undefined && budget !== null) {
      const numBudget = Number(budget);
      if (isNaN(numBudget) || numBudget < 0) {
        return { success: false, error: "Budget must be a non-negative number" };
      }
    }

    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Invalid date format" };
      }
    }

    const event = await createEvent({
      organizationId,
      name: name.trim(),
      type,
      date,
      location,
      budget,
      status,
      description
    });

    return {
      success: true,
      data: event
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing event
 * @param {string} eventId - Event ID
 * @param {string} organizationId - Organization ID
 * @param {Object} updates - Update data
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const updateExistingEvent = async (eventId, organizationId, updates) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Check if event exists and belongs to organization
    const existingEvent = await findEventById(eventId, organizationId);
    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
        return { success: false, error: "Event name cannot be empty" };
      }
      if (updates.name.trim().length > 255) {
        return { success: false, error: "Event name must be 255 characters or less" };
      }
      updates.name = updates.name.trim();
    }

    if (updates.type !== undefined && !VALID_EVENT_TYPES.includes(updates.type)) {
      return { success: false, error: `Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(", ")}` };
    }

    if (updates.status !== undefined && !VALID_EVENT_STATUSES.includes(updates.status)) {
      return { success: false, error: `Invalid status. Valid statuses: ${VALID_EVENT_STATUSES.join(", ")}` };
    }

    if (updates.budget !== undefined && updates.budget !== null) {
      const numBudget = Number(updates.budget);
      if (isNaN(numBudget) || numBudget < 0) {
        return { success: false, error: "Budget must be a non-negative number" };
      }
    }

    if (updates.date !== undefined && updates.date !== null) {
      const dateObj = new Date(updates.date);
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Invalid date format" };
      }
    }

    const event = await updateEvent(eventId, updates);

    return {
      success: true,
      data: event
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<{success: boolean, message: string}|{success: boolean, error: string}>}
 */
const removeEvent = async (eventId, organizationId) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Check if event exists and belongs to organization
    const existingEvent = await findEventById(eventId, organizationId);
    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    const deleted = await deleteEvent(eventId);

    if (!deleted) {
      return { success: false, error: "Failed to delete event" };
    }

    return {
      success: true,
      message: "Event deleted successfully"
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =====================
// Tasks Service
// =====================

/**
 * Get tasks for an event
 * @param {string} eventId - Event ID
 * @param {string} organizationId - Organization ID
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const getEventTasks = async (eventId, organizationId, filters = {}) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Verify event exists and belongs to organization
    const event = await findEventById(eventId, organizationId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const tasks = await findTasksByEvent(eventId, filters);

    return {
      success: true,
      data: {
        tasks,
        eventId,
        total: tasks.length
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new task for an event
 * @param {string} eventId - Event ID
 * @param {string} organizationId - Organization ID
 * @param {Object} data - Task data
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const createNewTask = async (eventId, organizationId, data) => {
  try {
    const { title, description, dueDate, status, priority, assignedTo } = data;

    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Verify event exists and belongs to organization
    const event = await findEventById(eventId, organizationId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return { success: false, error: "Task title is required" };
    }

    if (title.trim().length > 255) {
      return { success: false, error: "Task title must be 255 characters or less" };
    }

    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return { success: false, error: `Invalid status. Valid statuses: ${VALID_TASK_STATUSES.join(", ")}` };
    }

    if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
      return { success: false, error: `Invalid priority. Valid priorities: ${VALID_TASK_PRIORITIES.join(", ")}` };
    }

    if (dueDate) {
      const dateObj = new Date(dueDate);
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Invalid due date format" };
      }
    }

    const task = await createTask({
      eventId,
      title: title.trim(),
      description,
      dueDate,
      status,
      priority,
      assignedTo
    });

    return {
      success: true,
      data: task
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing task
 * @param {string} eventId - Event ID
 * @param {string} taskId - Task ID
 * @param {string} organizationId - Organization ID
 * @param {Object} updates - Update data
 * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
 */
const updateExistingTask = async (eventId, taskId, organizationId, updates) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Verify event exists and belongs to organization
    const event = await findEventById(eventId, organizationId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Verify task exists and belongs to event
    const existingTask = await findTaskById(taskId);
    if (!existingTask || existingTask.event_id !== eventId) {
      return { success: false, error: "Task not found" };
    }

    // Validate updates
    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || updates.title.trim().length === 0) {
        return { success: false, error: "Task title cannot be empty" };
      }
      if (updates.title.trim().length > 255) {
        return { success: false, error: "Task title must be 255 characters or less" };
      }
      updates.title = updates.title.trim();
    }

    if (updates.status !== undefined && !VALID_TASK_STATUSES.includes(updates.status)) {
      return { success: false, error: `Invalid status. Valid statuses: ${VALID_TASK_STATUSES.join(", ")}` };
    }

    if (updates.priority !== undefined && !VALID_TASK_PRIORITIES.includes(updates.priority)) {
      return { success: false, error: `Invalid priority. Valid priorities: ${VALID_TASK_PRIORITIES.join(", ")}` };
    }

    if (updates.dueDate !== undefined && updates.dueDate !== null) {
      const dateObj = new Date(updates.dueDate);
      if (isNaN(dateObj.getTime())) {
        return { success: false, error: "Invalid due date format" };
      }
    }

    const task = await updateTask(taskId, updates);

    return {
      success: true,
      data: task
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a task
 * @param {string} eventId - Event ID
 * @param {string} taskId - Task ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<{success: boolean, message: string}|{success: boolean, error: string}>}
 */
const removeTask = async (eventId, taskId, organizationId) => {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    if (!organizationId) {
      return { success: false, error: "Organization ID is required" };
    }

    // Verify event exists and belongs to organization
    const event = await findEventById(eventId, organizationId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Verify task exists and belongs to event
    const existingTask = await findTaskById(taskId);
    if (!existingTask || existingTask.event_id !== eventId) {
      return { success: false, error: "Task not found" };
    }

    const deleted = await deleteTask(taskId);

    if (!deleted) {
      return { success: false, error: "Failed to delete task" };
    }

    return {
      success: true,
      message: "Task deleted successfully"
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  // Events
  getOrganizationEvents,
  getEvent,
  createNewEvent,
  updateExistingEvent,
  removeEvent,

  // Tasks
  getEventTasks,
  createNewTask,
  updateExistingTask,
  removeTask
};
