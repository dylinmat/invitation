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

// =====================
// Route Handlers - Guests
// =====================

const handleListGuests = async (req, res, projectId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const groupId = url.searchParams.get("groupId");
  const role = url.searchParams.get("role");
  const tagId = url.searchParams.get("tagId");
  const search = url.searchParams.get("search");

  const guests = await getProjectGuests(projectId, { groupId, role, tagId, search });
  return { status: 200, body: { guests } };
};

const handleCreateGuest = async (req, res, projectId, body) => {
  const guestId = await createProjectGuest(projectId, {
    groupId: body.groupId,
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role,
    contacts: body.contacts,
    tagIds: body.tagIds
  });
  return { status: 201, body: { id: guestId, message: "Guest created successfully" } };
};

const handleGetGuest = async (req, res, guestId) => {
  const guest = await getGuest(guestId);
  return { status: 200, body: { guest } };
};

const handleUpdateGuest = async (req, res, guestId, body) => {
  await updateProjectGuest(guestId, {
    groupId: body.groupId,
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role,
    contacts: body.contacts
  });
  return { status: 200, body: { message: "Guest updated successfully" } };
};

const handleDeleteGuest = async (req, res, guestId) => {
  await deleteProjectGuest(guestId);
  return { status: 200, body: { message: "Guest deleted successfully" } };
};

const handleImportGuests = async (req, res, projectId, body) => {
  const result = await importGuests(projectId, body.guests);
  return { status: 201, body: { ...result, message: "Guests imported successfully" } };
};

// =====================
// Route Handlers - Guest Contacts
// =====================

const handleAddContact = async (req, res, guestId, body) => {
  const contactId = await addGuestContact(guestId, {
    email: body.email,
    phone: body.phone
  });
  return { status: 201, body: { id: contactId, message: "Contact added successfully" } };
};

const handleUpdateContact = async (req, res, contactId, body) => {
  await updateGuestContactInfo(contactId, {
    email: body.email,
    phone: body.phone
  });
  return { status: 200, body: { message: "Contact updated successfully" } };
};

const handleDeleteContact = async (req, res, contactId) => {
  await removeGuestContact(contactId);
  return { status: 200, body: { message: "Contact deleted successfully" } };
};

// =====================
// Route Handlers - Guest Groups
// =====================

const handleListGroups = async (req, res, projectId) => {
  const groups = await getProjectGuestGroups(projectId);
  return { status: 200, body: { groups } };
};

const handleCreateGroup = async (req, res, projectId, body) => {
  const groupId = await createProjectGuestGroup(projectId, {
    name: body.name,
    householdLabel: body.householdLabel
  });
  return { status: 201, body: { id: groupId, message: "Group created successfully" } };
};

const handleUpdateGroup = async (req, res, groupId, body) => {
  await updateProjectGuestGroup(groupId, {
    name: body.name,
    householdLabel: body.householdLabel
  });
  return { status: 200, body: { message: "Group updated successfully" } };
};

const handleDeleteGroup = async (req, res, groupId) => {
  await deleteProjectGuestGroup(groupId);
  return { status: 200, body: { message: "Group deleted successfully" } };
};

// =====================
// Route Handlers - Guest Tags
// =====================

const handleListTags = async (req, res, projectId) => {
  const tags = await getProjectGuestTags(projectId);
  return { status: 200, body: { tags } };
};

const handleCreateTag = async (req, res, projectId, body) => {
  const tagId = await createProjectGuestTag(projectId, body.name);
  return { status: 201, body: { id: tagId, message: "Tag created successfully" } };
};

const handleDeleteTag = async (req, res, tagId) => {
  await deleteProjectGuestTag(tagId);
  return { status: 200, body: { message: "Tag deleted successfully" } };
};

const handleAssignTag = async (req, res, guestId, body) => {
  await assignGuestTag(guestId, body.tagId);
  return { status: 200, body: { message: "Tag assigned successfully" } };
};

const handleRemoveTag = async (req, res, guestId, tagId) => {
  await removeGuestTag(guestId, tagId);
  return { status: 200, body: { message: "Tag removed successfully" } };
};

// =====================
// Route Handlers - Invites
// =====================

const handleListInvites = async (req, res, projectId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const siteId = url.searchParams.get("siteId");
  const guestId = url.searchParams.get("guestId");
  const groupId = url.searchParams.get("groupId");

  const invites = await getProjectInvites(projectId, { siteId, guestId, groupId });
  return { status: 200, body: { invites } };
};

const handleCreateInvite = async (req, res, projectId, body) => {
  const result = await createProjectInvite(projectId, {
    siteId: body.siteId,
    guestId: body.guestId,
    groupId: body.groupId,
    securityMode: body.securityMode,
    passcode: body.passcode,
    expiresAt: body.expiresAt
  });
  return { status: 201, body: { ...result, message: "Invite created successfully" } };
};

const handleGetInvite = async (req, res, inviteId) => {
  const invite = await getInvite(inviteId);
  return { status: 200, body: { invite } };
};

const handleRevokeInvite = async (req, res, inviteId) => {
  await revokeProjectInvite(inviteId);
  return { status: 200, body: { message: "Invite revoked successfully" } };
};

const handleRegenerateInviteToken = async (req, res, inviteId) => {
  const result = await regenerateProjectInviteToken(inviteId);
  return { status: 200, body: { ...result, message: "Token regenerated successfully" } };
};

const handleValidateInviteToken = async (req, res, token, body, reqInfo) => {
  const result = await validateInviteToken(token, {
    passcode: body.passcode,
    ipAddress: reqInfo.ipAddress,
    userAgent: reqInfo.userAgent
  });
  return { status: 200, body: result };
};

const handleGetInviteLogs = async (req, res, inviteId) => {
  const logs = await getInviteLogs(inviteId);
  return { status: 200, body: { logs } };
};

// =====================
// Route Handlers - RSVP Forms
// =====================

const handleListRsvpForms = async (req, res, projectId) => {
  const forms = await getProjectRsvpForms(projectId);
  return { status: 200, body: { forms } };
};

const handleCreateRsvpForm = async (req, res, projectId, body) => {
  const formId = await createProjectRsvpForm(projectId, {
    name: body.name,
    questions: body.questions || []
  });
  return { status: 201, body: { id: formId, message: "RSVP form created successfully" } };
};

const handleGetRsvpForm = async (req, res, formId) => {
  const form = await getRsvpForm(formId);
  return { status: 200, body: { form } };
};

const handleUpdateRsvpForm = async (req, res, formId, body) => {
  await updateProjectRsvpForm(formId, {
    name: body.name,
    questions: body.questions
  });
  return { status: 200, body: { message: "RSVP form updated successfully" } };
};

const handleDeleteRsvpForm = async (req, res, formId) => {
  await deleteProjectRsvpForm(formId);
  return { status: 200, body: { message: "RSVP form deleted successfully" } };
};

// =====================
// Route Handlers - RSVP Questions
// =====================

const handleAddQuestion = async (req, res, formId, body) => {
  const questionId = await addRsvpQuestion(formId, {
    eventId: body.eventId,
    label: body.label,
    helpText: body.helpText,
    type: body.type,
    required: body.required,
    sortOrder: body.sortOrder,
    options: body.options,
    logicRules: body.logicRules
  });
  return { status: 201, body: { id: questionId, message: "Question added successfully" } };
};

const handleDeleteQuestion = async (req, res, questionId) => {
  await removeRsvpQuestion(questionId);
  return { status: 200, body: { message: "Question deleted successfully" } };
};

// =====================
// Route Handlers - RSVP Submissions
// =====================

const handleListSubmissions = async (req, res, formId) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const inviteId = url.searchParams.get("inviteId");
  const guestId = url.searchParams.get("guestId");

  const submissions = await getFormSubmissions(formId, { inviteId, guestId });
  return { status: 200, body: { submissions } };
};

const handleGetSubmission = async (req, res, submissionId) => {
  const submission = await getSubmission(submissionId);
  return { status: 200, body: { submission } };
};

const handleSubmitRsvp = async (req, res, body) => {
  const result = await submitRsvp({
    formId: body.formId,
    inviteToken: body.inviteToken,
    guestId: body.guestId,
    answers: body.answers || [],
    channel: body.channel
  });
  return { status: 201, body: { ...result, message: "RSVP submitted successfully" } };
};

// =====================
// Route Matching
// =====================

const matchRoute = (method, pathname) => {
  // Guests
  if (method === "GET" && /^\/projects\/[^/]+\/guests$/.test(pathname)) {
    return { handler: "listGuests", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/guests$/.test(pathname)) {
    return { handler: "createGuest", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/guests\/import$/.test(pathname)) {
    return { handler: "importGuests", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/guests\/[^/]+$/.test(pathname)) {
    return { handler: "getGuest", params: { guestId: pathname.split("/")[2] } };
  }
  if (method === "PUT" && /^\/guests\/[^/]+$/.test(pathname)) {
    return { handler: "updateGuest", params: { guestId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/guests\/[^/]+$/.test(pathname)) {
    return { handler: "deleteGuest", params: { guestId: pathname.split("/")[2] } };
  }

  // Guest Contacts
  if (method === "POST" && /^\/guests\/[^/]+\/contacts$/.test(pathname)) {
    return { handler: "addContact", params: { guestId: pathname.split("/")[2] } };
  }
  if (method === "PUT" && /^\/contacts\/[^/]+$/.test(pathname)) {
    return { handler: "updateContact", params: { contactId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/contacts\/[^/]+$/.test(pathname)) {
    return { handler: "deleteContact", params: { contactId: pathname.split("/")[2] } };
  }

  // Guest Groups
  if (method === "GET" && /^\/projects\/[^/]+\/groups$/.test(pathname)) {
    return { handler: "listGroups", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/groups$/.test(pathname)) {
    return { handler: "createGroup", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "PUT" && /^\/groups\/[^/]+$/.test(pathname)) {
    return { handler: "updateGroup", params: { groupId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/groups\/[^/]+$/.test(pathname)) {
    return { handler: "deleteGroup", params: { groupId: pathname.split("/")[2] } };
  }

  // Guest Tags
  if (method === "GET" && /^\/projects\/[^/]+\/tags$/.test(pathname)) {
    return { handler: "listTags", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/tags$/.test(pathname)) {
    return { handler: "createTag", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/tags\/[^/]+$/.test(pathname)) {
    return { handler: "deleteTag", params: { tagId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/guests\/[^/]+\/tags$/.test(pathname)) {
    return { handler: "assignTag", params: { guestId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/guests\/[^/]+\/tags\/[^/]+$/.test(pathname)) {
    return { handler: "removeTag", params: { guestId: pathname.split("/")[2], tagId: pathname.split("/")[4] } };
  }

  // Invites
  if (method === "GET" && /^\/projects\/[^/]+\/invites$/.test(pathname)) {
    return { handler: "listInvites", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/invites$/.test(pathname)) {
    return { handler: "createInvite", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/invites\/[^/]+$/.test(pathname)) {
    return { handler: "getInvite", params: { inviteId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/invites\/[^/]+\/revoke$/.test(pathname)) {
    return { handler: "revokeInvite", params: { inviteId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/invites\/[^/]+\/regenerate$/.test(pathname)) {
    return { handler: "regenerateInvite", params: { inviteId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/invites\/[^/]+\/logs$/.test(pathname)) {
    return { handler: "getInviteLogs", params: { inviteId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/invites\/[^/]+\/validate$/.test(pathname)) {
    return { handler: "validateInvite", params: { token: pathname.split("/")[2] } };
  }

  // RSVP Forms
  if (method === "GET" && /^\/projects\/[^/]+\/rsvp-forms$/.test(pathname)) {
    return { handler: "listRsvpForms", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/projects\/[^/]+\/rsvp-forms$/.test(pathname)) {
    return { handler: "createRsvpForm", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/rsvp-forms\/[^/]+$/.test(pathname)) {
    return { handler: "getRsvpForm", params: { formId: pathname.split("/")[2] } };
  }
  if (method === "PUT" && /^\/rsvp-forms\/[^/]+$/.test(pathname)) {
    return { handler: "updateRsvpForm", params: { formId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/rsvp-forms\/[^/]+$/.test(pathname)) {
    return { handler: "deleteRsvpForm", params: { formId: pathname.split("/")[2] } };
  }

  // RSVP Questions
  if (method === "POST" && /^\/rsvp-forms\/[^/]+\/questions$/.test(pathname)) {
    return { handler: "addQuestion", params: { formId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/rsvp-questions\/[^/]+$/.test(pathname)) {
    return { handler: "deleteQuestion", params: { questionId: pathname.split("/")[2] } };
  }

  // RSVP Submissions
  if (method === "GET" && /^\/rsvp-forms\/[^/]+\/submissions$/.test(pathname)) {
    return { handler: "listSubmissions", params: { formId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/rsvp-submissions\/[^/]+$/.test(pathname)) {
    return { handler: "getSubmission", params: { submissionId: pathname.split("/")[2] } };
  }
  if (method === "POST" && pathname === "/rsvp/submit") {
    return { handler: "submitRsvp", params: {} };
  }

  return null;
};

// =====================
// Main Handler
// =====================

const handleGuestsRoutes = async (req, res, body, reqInfo) => {
  const route = matchRoute(req.method, req.pathname);

  if (!route) {
    return null; // Not a guests route
  }

  const { handler, params } = route;

  try {
    let result;

    switch (handler) {
      // Guests
      case "listGuests":
        result = await handleListGuests(req, res, params.projectId);
        break;
      case "createGuest":
        result = await handleCreateGuest(req, res, params.projectId, body);
        break;
      case "getGuest":
        result = await handleGetGuest(req, res, params.guestId);
        break;
      case "updateGuest":
        result = await handleUpdateGuest(req, res, params.guestId, body);
        break;
      case "deleteGuest":
        result = await handleDeleteGuest(req, res, params.guestId);
        break;
      case "importGuests":
        result = await handleImportGuests(req, res, params.projectId, body);
        break;

      // Guest Contacts
      case "addContact":
        result = await handleAddContact(req, res, params.guestId, body);
        break;
      case "updateContact":
        result = await handleUpdateContact(req, res, params.contactId, body);
        break;
      case "deleteContact":
        result = await handleDeleteContact(req, res, params.contactId);
        break;

      // Guest Groups
      case "listGroups":
        result = await handleListGroups(req, res, params.projectId);
        break;
      case "createGroup":
        result = await handleCreateGroup(req, res, params.projectId, body);
        break;
      case "updateGroup":
        result = await handleUpdateGroup(req, res, params.groupId, body);
        break;
      case "deleteGroup":
        result = await handleDeleteGroup(req, res, params.groupId);
        break;

      // Guest Tags
      case "listTags":
        result = await handleListTags(req, res, params.projectId);
        break;
      case "createTag":
        result = await handleCreateTag(req, res, params.projectId, body);
        break;
      case "deleteTag":
        result = await handleDeleteTag(req, res, params.tagId);
        break;
      case "assignTag":
        result = await handleAssignTag(req, res, params.guestId, body);
        break;
      case "removeTag":
        result = await handleRemoveTag(req, res, params.guestId, params.tagId);
        break;

      // Invites
      case "listInvites":
        result = await handleListInvites(req, res, params.projectId);
        break;
      case "createInvite":
        result = await handleCreateInvite(req, res, params.projectId, body);
        break;
      case "getInvite":
        result = await handleGetInvite(req, res, params.inviteId);
        break;
      case "revokeInvite":
        result = await handleRevokeInvite(req, res, params.inviteId);
        break;
      case "regenerateInvite":
        result = await handleRegenerateInviteToken(req, res, params.inviteId);
        break;
      case "validateInvite":
        result = await handleValidateInviteToken(req, res, params.token, body, reqInfo);
        break;
      case "getInviteLogs":
        result = await handleGetInviteLogs(req, res, params.inviteId);
        break;

      // RSVP Forms
      case "listRsvpForms":
        result = await handleListRsvpForms(req, res, params.projectId);
        break;
      case "createRsvpForm":
        result = await handleCreateRsvpForm(req, res, params.projectId, body);
        break;
      case "getRsvpForm":
        result = await handleGetRsvpForm(req, res, params.formId);
        break;
      case "updateRsvpForm":
        result = await handleUpdateRsvpForm(req, res, params.formId, body);
        break;
      case "deleteRsvpForm":
        result = await handleDeleteRsvpForm(req, res, params.formId);
        break;

      // RSVP Questions
      case "addQuestion":
        result = await handleAddQuestion(req, res, params.formId, body);
        break;
      case "deleteQuestion":
        result = await handleDeleteQuestion(req, res, params.questionId);
        break;

      // RSVP Submissions
      case "listSubmissions":
        result = await handleListSubmissions(req, res, params.formId);
        break;
      case "getSubmission":
        result = await handleGetSubmission(req, res, params.submissionId);
        break;
      case "submitRsvp":
        result = await handleSubmitRsvp(req, res, body);
        break;

      default:
        return null;
    }

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  handleGuestsRoutes
};
