const {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  listClientNotes,
  createClientNote,
  getClientEvents,
  checkOrganizationAccess
} = require("./repository");

// =====================
// Clients Service
// =====================

const VALID_CLIENT_TYPES = ["couple", "corporate", "individual"];
const VALID_CLIENT_STATUS = ["active", "inactive", "archived"];

const getOrganizationClients = async (organizationId, filters = {}) => {
  return listClients(organizationId, filters);
};

const getClient = async (clientId) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }
  return client;
};

const createOrganizationClient = async (organizationId, {
  name,
  email,
  phone,
  address,
  type,
  status,
  notes
}) => {
  if (!name) {
    throw new Error("Client name is required");
  }

  if (type && !VALID_CLIENT_TYPES.includes(type)) {
    throw new Error(`Invalid client type. Valid types: ${VALID_CLIENT_TYPES.join(", ")}`);
  }

  if (status && !VALID_CLIENT_STATUS.includes(status)) {
    throw new Error(`Invalid client status. Valid status: ${VALID_CLIENT_STATUS.join(", ")}`);
  }

  const clientId = await createClient({
    organizationId,
    name,
    email,
    phone,
    address,
    type,
    status,
    notes
  });

  return clientId;
};

const updateOrganizationClient = async (clientId, updates) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  if (updates.type && !VALID_CLIENT_TYPES.includes(updates.type)) {
    throw new Error(`Invalid client type. Valid types: ${VALID_CLIENT_TYPES.join(", ")}`);
  }

  if (updates.status && !VALID_CLIENT_STATUS.includes(updates.status)) {
    throw new Error(`Invalid client status. Valid status: ${VALID_CLIENT_STATUS.join(", ")}`);
  }

  const updatedId = await updateClient(clientId, updates);
  return updatedId;
};

const deleteOrganizationClient = async (clientId) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }
  await deleteClient(clientId);
  return { success: true };
};

// =====================
// Client Notes Service
// =====================

const getClientNotesList = async (clientId) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }
  return listClientNotes(clientId);
};

const addClientNote = async (clientId, { note, createdBy }) => {
  if (!note || note.trim() === "") {
    throw new Error("Note content is required");
  }

  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const noteId = await createClientNote({ clientId, note, createdBy });
  return noteId;
};

// =====================
// Client Events Service
// =====================

const getClientEventsList = async (clientId) => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }
  return getClientEvents(clientId);
};

// =====================
// Access Control Service
// =====================

const verifyOrganizationAccess = async (userId, organizationId) => {
  const hasAccess = await checkOrganizationAccess(userId, organizationId);
  if (!hasAccess) {
    throw new Error("Access denied: You do not have permission to access this organization");
  }
  return true;
};

module.exports = {
  // Clients
  getOrganizationClients,
  getClient,
  createOrganizationClient,
  updateOrganizationClient,
  deleteOrganizationClient,

  // Client Notes
  getClientNotesList,
  addClientNote,

  // Client Events
  getClientEventsList,

  // Access Control
  verifyOrganizationAccess
};
