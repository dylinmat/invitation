/**
 * Guests Module - Fastify Plugin
 * 
 * This module handles guest management, including:
 * - Guest CRUD operations
 * - Guest groups and tags
 * - Invites and RSVP forms
 * - RSVP submissions
 */

const { guestRoutes } = require("./routes");

const {
  // Guest Groups
  getProjectGuestGroups,
  createProjectGuestGroup,
  updateProjectGuestGroup,
  deleteProjectGuestGroup,

  // Guests
  getProjectGuests,
  getGuest,
  createProjectGuest,
  updateProjectGuest,
  deleteProjectGuest,
  importGuests,

  // Guest Contacts
  addGuestContact,
  updateGuestContactInfo,
  removeGuestContact,

  // Guest Tags
  getProjectGuestTags,
  createProjectGuestTag,
  deleteProjectGuestTag,
  assignGuestTag,
  removeGuestTag,

  // Invites
  getProjectInvites,
  getInvite,
  createProjectInvite,
  revokeProjectInvite,
  regenerateProjectInviteToken,
  validateInviteToken,
  getInviteLogs,

  // RSVP Forms
  getProjectRsvpForms,
  getRsvpForm,
  createProjectRsvpForm,
  updateProjectRsvpForm,
  deleteProjectRsvpForm,

  // RSVP Questions
  addRsvpQuestion,
  removeRsvpQuestion,

  // RSVP Submissions
  getFormSubmissions,
  getSubmission,
  submitRsvp
} = require("./service");

/**
 * Fastify plugin for Guests module
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function guestsPlugin(fastify, opts) {
  // Register guest routes
  await fastify.register(guestRoutes);

  fastify.log.info("Guests module registered");
}

// Export the module as an object with register function for module loader
module.exports = {
  name: "guests",
  prefix: "/guests",
  register: guestsPlugin,
};

// Export route handlers for testing or custom registration
module.exports.guestRoutes = guestRoutes;

// Export service methods for programmatic use
module.exports.getProjectGuestGroups = getProjectGuestGroups;
module.exports.createProjectGuestGroup = createProjectGuestGroup;
module.exports.updateProjectGuestGroup = updateProjectGuestGroup;
module.exports.deleteProjectGuestGroup = deleteProjectGuestGroup;
module.exports.getProjectGuests = getProjectGuests;
module.exports.getGuest = getGuest;
module.exports.createProjectGuest = createProjectGuest;
module.exports.updateProjectGuest = updateProjectGuest;
module.exports.deleteProjectGuest = deleteProjectGuest;
module.exports.importGuests = importGuests;
module.exports.addGuestContact = addGuestContact;
module.exports.updateGuestContactInfo = updateGuestContactInfo;
module.exports.removeGuestContact = removeGuestContact;
module.exports.getProjectGuestTags = getProjectGuestTags;
module.exports.createProjectGuestTag = createProjectGuestTag;
module.exports.deleteProjectGuestTag = deleteProjectGuestTag;
module.exports.assignGuestTag = assignGuestTag;
module.exports.removeGuestTag = removeGuestTag;
module.exports.getProjectInvites = getProjectInvites;
module.exports.getInvite = getInvite;
module.exports.createProjectInvite = createProjectInvite;
module.exports.revokeProjectInvite = revokeProjectInvite;
module.exports.regenerateProjectInviteToken = regenerateProjectInviteToken;
module.exports.validateInviteToken = validateInviteToken;
module.exports.getInviteLogs = getInviteLogs;
module.exports.getProjectRsvpForms = getProjectRsvpForms;
module.exports.getRsvpForm = getRsvpForm;
module.exports.createProjectRsvpForm = createProjectRsvpForm;
module.exports.updateProjectRsvpForm = updateProjectRsvpForm;
module.exports.deleteProjectRsvpForm = deleteProjectRsvpForm;
module.exports.addRsvpQuestion = addRsvpQuestion;
module.exports.removeRsvpQuestion = removeRsvpQuestion;
module.exports.getFormSubmissions = getFormSubmissions;
module.exports.getSubmission = getSubmission;
module.exports.submitRsvp = submitRsvp;
