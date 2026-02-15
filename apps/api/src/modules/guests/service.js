const {
  // Guest Groups
  listGuestGroups,
  getGuestGroupById,
  createGuestGroup,
  updateGuestGroup,
  deleteGuestGroup,

  // Guests
  listGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  bulkInsertGuests,

  // Guest Contacts
  createGuestContact,
  updateGuestContact,
  deleteGuestContact,

  // Guest Tags
  listGuestTags,
  createGuestTag,
  deleteGuestTag,
  assignTagToGuest,
  removeTagFromGuest,

  // Invites
  listInvites,
  getInviteById,
  getInviteByToken,
  createInvite,
  revokeInvite,
  regenerateInviteToken,
  logInviteAccess,
  getInviteAccessLogs,

  // RSVP Forms
  listRsvpForms,
  getRsvpFormById,
  getRsvpFormWithQuestions,
  createRsvpForm,
  deleteRsvpForm,

  // RSVP Questions
  createRsvpQuestion,
  updateRsvpQuestion,
  deleteRsvpQuestion,

  // RSVP Question Options
  createQuestionOption,
  deleteQuestionOption,

  // RSVP Logic Rules
  createLogicRule,
  deleteLogicRule,

  // RSVP Submissions
  createRsvpSubmission,
  createRsvpAnswer,
  getRsvpSubmissions,
  getRsvpSubmissionWithAnswers
} = require("./repository");

// =====================
// Guest Groups Service
// =====================

const getProjectGuestGroups = async (projectId) => {
  return listGuestGroups(projectId);
};

const createProjectGuestGroup = async (projectId, { name, householdLabel }) => {
  if (!name) {
    throw new Error("Group name is required");
  }
  return createGuestGroup({ projectId, name, householdLabel });
};

const updateProjectGuestGroup = async (groupId, updates) => {
  const group = await getGuestGroupById(groupId);
  if (!group) {
    throw new Error("Guest group not found");
  }
  return updateGuestGroup(groupId, updates);
};

const deleteProjectGuestGroup = async (groupId) => {
  const group = await getGuestGroupById(groupId);
  if (!group) {
    throw new Error("Guest group not found");
  }
  await deleteGuestGroup(groupId);
  return { success: true };
};

// =====================
// Guests Service
// =====================

const getProjectGuests = async (projectId, filters = {}) => {
  return listGuests(projectId, filters);
};

const getGuest = async (guestId) => {
  const guest = await getGuestById(guestId);
  if (!guest) {
    throw new Error("Guest not found");
  }
  return guest;
};

const createProjectGuest = async (projectId, {
  groupId,
  firstName,
  lastName,
  role,
  contacts,
  tagIds
}) => {
  if (!firstName && !lastName) {
    throw new Error("First name or last name is required");
  }

  const guestId = await createGuest({
    projectId,
    groupId,
    firstName,
    lastName,
    role
  });

  // Add contacts if provided
  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      await createGuestContact(guestId, contact);
    }
  }

  // Assign tags if provided
  if (tagIds && tagIds.length > 0) {
    for (const tagId of tagIds) {
      await assignTagToGuest(guestId, tagId);
    }
  }

  return guestId;
};

const updateProjectGuest = async (guestId, updates) => {
  const guest = await getGuestById(guestId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  await updateGuest(guestId, updates);

  // Handle contacts updates if provided
  if (updates.contacts) {
    // Note: In a real implementation, you'd want more sophisticated merge logic
    // This is a simplified version
    for (const contact of updates.contacts) {
      if (contact.id) {
        await updateGuestContact(contact.id, contact);
      } else {
        await createGuestContact(guestId, contact);
      }
    }
  }

  return { success: true };
};

const deleteProjectGuest = async (guestId) => {
  const guest = await getGuestById(guestId);
  if (!guest) {
    throw new Error("Guest not found");
  }
  await deleteGuest(guestId);
  return { success: true };
};

const importGuests = async (projectId, guestsData) => {
  if (!Array.isArray(guestsData) || guestsData.length === 0) {
    throw new Error("Guests array is required");
  }

  const createdIds = await bulkInsertGuests(projectId, guestsData);
  return { importedCount: createdIds.length, guestIds: createdIds };
};

// =====================
// Guest Contacts Service
// =====================

const addGuestContact = async (guestId, { email, phone }) => {
  if (!email && !phone) {
    throw new Error("Email or phone is required");
  }
  return createGuestContact(guestId, { email, phone });
};

const updateGuestContactInfo = async (contactId, { email, phone }) => {
  return updateGuestContact(contactId, { email, phone });
};

const removeGuestContact = async (contactId) => {
  await deleteGuestContact(contactId);
  return { success: true };
};

// =====================
// Guest Tags Service
// =====================

const getProjectGuestTags = async (projectId) => {
  return listGuestTags(projectId);
};

const createProjectGuestTag = async (projectId, name) => {
  if (!name) {
    throw new Error("Tag name is required");
  }
  return createGuestTag(projectId, name);
};

const deleteProjectGuestTag = async (tagId) => {
  await deleteGuestTag(tagId);
  return { success: true };
};

const assignGuestTag = async (guestId, tagId) => {
  await assignTagToGuest(guestId, tagId);
  return { success: true };
};

const removeGuestTag = async (guestId, tagId) => {
  await removeTagFromGuest(guestId, tagId);
  return { success: true };
};

// =====================
// Invites Service
// =====================

const VALID_SECURITY_MODES = [
  "OPEN",
  "LINK_LOCKED",
  "PASSCODE",
  "OTP_FIRST_TIME",
  "OTP_EVERY_SESSION",
  "OTP_EVERY_TIME"
];

const getProjectInvites = async (projectId, filters = {}) => {
  return listInvites(projectId, filters);
};

const getInvite = async (inviteId) => {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  return invite;
};

const createProjectInvite = async (projectId, {
  siteId,
  guestId,
  groupId,
  securityMode,
  passcode,
  expiresAt
}) => {
  if (!siteId) {
    throw new Error("Site ID is required");
  }

  if (securityMode && !VALID_SECURITY_MODES.includes(securityMode)) {
    throw new Error(`Invalid security mode. Valid modes: ${VALID_SECURITY_MODES.join(", ")}`);
  }

  if (securityMode === "PASSCODE" && !passcode) {
    throw new Error("Passcode is required for PASSCODE security mode");
  }

  const result = await createInvite({
    projectId,
    siteId,
    guestId,
    groupId,
    securityMode: securityMode || "OPEN",
    passcode,
    expiresAt
  });

  return result;
};

const revokeProjectInvite = async (inviteId) => {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  await revokeInvite(inviteId);
  return { success: true };
};

const regenerateProjectInviteToken = async (inviteId) => {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  const newToken = await regenerateInviteToken(inviteId);
  return { token: newToken };
};

const validateInviteToken = async (token, { passcode, ipAddress, userAgent } = {}) => {
  const invite = await getInviteByToken(token);

  if (!invite) {
    throw new Error("Invalid invite token");
  }

  if (invite.revoked_at) {
    throw new Error("Invite has been revoked");
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error("Invite has expired");
  }

  // Check passcode for PASSCODE mode
  if (invite.security_mode === "PASSCODE") {
    if (!passcode) {
      throw new Error("Passcode is required");
    }
    const crypto = require("crypto");
    const passcodeHash = crypto.createHash("sha256").update(passcode).digest("hex");
    if (passcodeHash !== invite.passcode_hash) {
      throw new Error("Invalid passcode");
    }
  }

  // Log access
  await logInviteAccess(invite.id, { ipAddress, userAgent });

  // For OTP modes, additional validation would happen here
  // This would integrate with the messaging service

  return {
    valid: true,
    inviteId: invite.id,
    projectId: invite.project_id,
    siteId: invite.site_id,
    guestId: invite.guest_id,
    groupId: invite.group_id,
    securityMode: invite.security_mode,
    requiresOtp: invite.security_mode.startsWith("OTP_")
  };
};

const getInviteLogs = async (inviteId) => {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  return getInviteAccessLogs(inviteId);
};

// =====================
// RSVP Forms Service
// =====================

const getProjectRsvpForms = async (projectId) => {
  return listRsvpForms(projectId);
};

const getRsvpForm = async (formId) => {
  const form = await getRsvpFormWithQuestions(formId);
  if (!form) {
    throw new Error("RSVP form not found");
  }
  return form;
};

const createProjectRsvpForm = async (projectId, { name, questions = [] }) => {
  if (!name) {
    throw new Error("Form name is required");
  }

  const formId = await createRsvpForm(projectId, name);

  // Create questions if provided
  if (questions.length > 0) {
    for (const q of questions) {
      const questionId = await createRsvpQuestion({
        formId,
        eventId: q.eventId,
        label: q.label,
        helpText: q.helpText,
        type: q.type,
        required: q.required,
        sortOrder: q.sortOrder || 0
      });

      // Create options for select questions
      if (q.options && (q.type === "SINGLE_SELECT" || q.type === "MULTI_SELECT")) {
        for (const opt of q.options) {
          await createQuestionOption(questionId, opt);
        }
      }

      // Create logic rules if provided
      if (q.logicRules) {
        for (const rule of q.logicRules) {
          await createLogicRule({
            questionId,
            dependsOnQuestionId: rule.dependsOnQuestionId,
            operator: rule.operator,
            value: rule.value
          });
        }
      }
    }
  }

  return formId;
};

const updateProjectRsvpForm = async (formId, { name, questions }) => {
  const form = await getRsvpFormById(formId);
  if (!form) {
    throw new Error("RSVP form not found");
  }

  // Note: Full question updates would require more sophisticated logic
  // This is a simplified implementation
  if (questions) {
    for (const q of questions) {
      if (q.id) {
        await updateRsvpQuestion(q.id, q);
      }
    }
  }

  return { success: true };
};

const deleteProjectRsvpForm = async (formId) => {
  const form = await getRsvpFormById(formId);
  if (!form) {
    throw new Error("RSVP form not found");
  }
  await deleteRsvpForm(formId);
  return { success: true };
};

// =====================
// RSVP Questions Service
// =====================

const addRsvpQuestion = async (formId, {
  eventId,
  label,
  helpText,
  type,
  required,
  sortOrder,
  options,
  logicRules
}) => {
  const VALID_TYPES = ["TEXT", "YES_NO", "SINGLE_SELECT", "MULTI_SELECT", "NUMBER", "DATE", "FILE"];
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid question type. Valid types: ${VALID_TYPES.join(", ")}`);
  }

  const questionId = await createRsvpQuestion({
    formId,
    eventId,
    label,
    helpText,
    type,
    required,
    sortOrder: sortOrder || 0
  });

  if (options && (type === "SINGLE_SELECT" || type === "MULTI_SELECT")) {
    for (const opt of options) {
      await createQuestionOption(questionId, opt);
    }
  }

  if (logicRules) {
    for (const rule of logicRules) {
      await createLogicRule({
        questionId,
        dependsOnQuestionId: rule.dependsOnQuestionId,
        operator: rule.operator,
        value: rule.value
      });
    }
  }

  return questionId;
};

const removeRsvpQuestion = async (questionId) => {
  await deleteRsvpQuestion(questionId);
  return { success: true };
};

// =====================
// RSVP Submissions Service
// =====================

const getFormSubmissions = async (formId, filters = {}) => {
  return getRsvpSubmissions(formId, filters);
};

const getSubmission = async (submissionId) => {
  const submission = await getRsvpSubmissionWithAnswers(submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }
  return submission;
};

const submitRsvp = async ({
  formId,
  inviteToken,
  guestId,
  answers,
  channel
}) => {
  // Validate form exists
  const form = await getRsvpFormWithQuestions(formId);
  if (!form) {
    throw new Error("RSVP form not found");
  }

  // Validate invite if token provided
  let inviteId = null;
  if (inviteToken) {
    const invite = await getInviteByToken(inviteToken);
    if (!invite) {
      throw new Error("Invalid invite token");
    }
    inviteId = invite.id;
  }

  // Validate required questions are answered
  const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
  for (const question of form.questions) {
    if (question.required && !answeredQuestionIds.has(question.id)) {
      throw new Error(`Required question "${question.label}" is not answered`);
    }
  }

  // Create submission
  const submissionId = await createRsvpSubmission({
    formId,
    inviteId,
    guestId,
    channel
  });

  // Create answers
  const createdAnswers = [];
  for (const answer of answers) {
    const question = form.questions.find((q) => q.id === answer.questionId);
    if (!question) {
      continue; // Skip answers for non-existent questions
    }

    let answerText = null;
    let answerJson = null;

    switch (question.type) {
      case "TEXT":
      case "YES_NO":
      case "NUMBER":
      case "DATE":
        answerText = String(answer.value);
        break;
      case "SINGLE_SELECT":
        answerText = String(answer.value);
        break;
      case "MULTI_SELECT":
        answerJson = Array.isArray(answer.value) ? answer.value : [answer.value];
        break;
      case "FILE":
        answerJson = { fileUrl: answer.value };
        break;
      default:
        answerText = String(answer.value);
    }

    const answerId = await createRsvpAnswer({
      submissionId,
      questionId: answer.questionId,
      answerText,
      answerJson
    });
    createdAnswers.push(answerId);
  }

  return {
    submissionId,
    answerCount: createdAnswers.length
  };
};

module.exports = {
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
};
