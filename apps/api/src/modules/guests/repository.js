const { query } = require("../../db");
const crypto = require("crypto");

// =====================
// Guest Groups
// =====================

const listGuestGroups = async (projectId) => {
  const result = await query(
    `select id, name, household_label, created_at
     from guest_groups
     where project_id = $1
     order by created_at desc`,
    [projectId]
  );
  return result.rows;
};

const getGuestGroupById = async (groupId) => {
  const result = await query(
    `select id, project_id, name, household_label, created_at
     from guest_groups
     where id = $1`,
    [groupId]
  );
  return result.rows[0] || null;
};

const createGuestGroup = async ({ projectId, name, householdLabel }) => {
  const result = await query(
    `insert into guest_groups (project_id, name, household_label)
     values ($1, $2, $3)
     returning id`,
    [projectId, name, householdLabel || null]
  );
  return result.rows[0]?.id;
};

const updateGuestGroup = async (groupId, { name, householdLabel }) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIdx++}`);
    values.push(name);
  }
  if (householdLabel !== undefined) {
    updates.push(`household_label = $${paramIdx++}`);
    values.push(householdLabel);
  }

  if (updates.length === 0) {
    return null;
  }

  values.push(groupId);
  const result = await query(
    `update guest_groups set ${updates.join(", ")} where id = $${paramIdx} returning id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteGuestGroup = async (groupId) => {
  await query("delete from guest_groups where id = $1", [groupId]);
};

// =====================
// Guests
// =====================

const listGuests = async (projectId, { groupId, search, role, tagId } = {}) => {
  let sql = `
    select g.id, g.project_id, g.group_id, g.first_name, g.last_name, g.role, g.created_at, g.updated_at,
           gg.name as group_name, gg.household_label,
           coalesce(json_agg(distinct jsonb_build_object('id', gc.id, 'email', gc.email, 'phone', gc.phone)) 
             filter (where gc.id is not null), '[]') as contacts,
           coalesce(json_agg(distinct jsonb_build_object('id', gt.id, 'name', gt.name)) 
             filter (where gt.id is not null), '[]') as tags
    from guests g
    left join guest_groups gg on g.group_id = gg.id
    left join guest_contacts gc on gc.guest_id = g.id
    left join guest_tag_assignments gta on gta.guest_id = g.id
    left join guest_tags gt on gt.id = gta.tag_id
    where g.project_id = $1
  `;
  const params = [projectId];
  let paramIdx = 2;

  if (groupId) {
    sql += ` and g.group_id = $${paramIdx++}`;
    params.push(groupId);
  }
  if (role) {
    sql += ` and g.role = $${paramIdx++}`;
    params.push(role);
  }
  if (tagId) {
    sql += ` and exists (select 1 from guest_tag_assignments where guest_id = g.id and tag_id = $${paramIdx++})`;
    params.push(tagId);
  }
  if (search) {
    sql += ` and (g.first_name ilike $${paramIdx} or g.last_name ilike $${paramIdx} or g.first_name || ' ' || g.last_name ilike $${paramIdx})`;
    params.push(`%${search}%`);
  }

  sql += ` group by g.id, gg.name, gg.household_label order by g.created_at desc`;

  const result = await query(sql, params);
  return result.rows;
};

const getGuestById = async (guestId) => {
  const result = await query(
    `select g.id, g.project_id, g.group_id, g.first_name, g.last_name, g.role, g.created_at, g.updated_at,
            gg.name as group_name, gg.household_label,
            coalesce(json_agg(distinct jsonb_build_object('id', gc.id, 'email', gc.email, 'phone', gc.phone)) 
              filter (where gc.id is not null), '[]') as contacts,
            coalesce(json_agg(distinct jsonb_build_object('id', gt.id, 'name', gt.name)) 
              filter (where gt.id is not null), '[]') as tags
     from guests g
     left join guest_groups gg on g.group_id = gg.id
     left join guest_contacts gc on gc.guest_id = g.id
     left join guest_tag_assignments gta on gta.guest_id = g.id
     left join guest_tags gt on gt.id = gta.tag_id
     where g.id = $1
     group by g.id, gg.name, gg.household_label`,
    [guestId]
  );
  return result.rows[0] || null;
};

const createGuest = async ({ projectId, groupId, firstName, lastName, role }) => {
  const result = await query(
    `insert into guests (project_id, group_id, first_name, last_name, role)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [projectId, groupId || null, firstName, lastName, role || null]
  );
  return result.rows[0]?.id;
};

const updateGuest = async (guestId, { groupId, firstName, lastName, role }) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (groupId !== undefined) {
    updates.push(`group_id = $${paramIdx++}`);
    values.push(groupId);
  }
  if (firstName !== undefined) {
    updates.push(`first_name = $${paramIdx++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramIdx++}`);
    values.push(lastName);
  }
  if (role !== undefined) {
    updates.push(`role = $${paramIdx++}`);
    values.push(role);
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = now()`);
  values.push(guestId);

  const result = await query(
    `update guests set ${updates.join(", ")} where id = $${paramIdx} returning id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteGuest = async (guestId) => {
  await query("delete from guests where id = $1", [guestId]);
};

const bulkInsertGuests = async (projectId, guests) => {
  const createdIds = [];
  for (const g of guests) {
    const id = await createGuest({
      projectId,
      groupId: g.groupId,
      firstName: g.firstName,
      lastName: g.lastName,
      role: g.role
    });
    if (g.contacts && g.contacts.length > 0) {
      for (const contact of g.contacts) {
        await createGuestContact(id, contact);
      }
    }
    if (g.tagIds && g.tagIds.length > 0) {
      for (const tagId of g.tagIds) {
        await assignTagToGuest(id, tagId);
      }
    }
    createdIds.push(id);
  }
  return createdIds;
};

// =====================
// Guest Contacts
// =====================

const createGuestContact = async (guestId, { email, phone }) => {
  const result = await query(
    `insert into guest_contacts (guest_id, email, phone)
     values ($1, $2, $3)
     returning id`,
    [guestId, email || null, phone || null]
  );
  return result.rows[0]?.id;
};

const updateGuestContact = async (contactId, { email, phone }) => {
  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (email !== undefined) {
    updates.push(`email = $${paramIdx++}`);
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIdx++}`);
    values.push(phone);
  }

  if (updates.length === 0) {
    return null;
  }

  values.push(contactId);
  const result = await query(
    `update guest_contacts set ${updates.join(", ")} where id = $${paramIdx} returning id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteGuestContact = async (contactId) => {
  await query("delete from guest_contacts where id = $1", [contactId]);
};

// =====================
// Guest Tags
// =====================

const listGuestTags = async (projectId) => {
  const result = await query(
    `select id, name from guest_tags where project_id = $1 order by name`,
    [projectId]
  );
  return result.rows;
};

const createGuestTag = async (projectId, name) => {
  const result = await query(
    `insert into guest_tags (project_id, name) values ($1, $2) returning id`,
    [projectId, name]
  );
  return result.rows[0]?.id;
};

const deleteGuestTag = async (tagId) => {
  await query("delete from guest_tags where id = $1", [tagId]);
};

const assignTagToGuest = async (guestId, tagId) => {
  try {
    await query(
      `insert into guest_tag_assignments (guest_id, tag_id) values ($1, $2)`,
      [guestId, tagId]
    );
    return true;
  } catch (err) {
    if (err.message?.includes("unique")) {
      return true;
    }
    throw err;
  }
};

const removeTagFromGuest = async (guestId, tagId) => {
  await query(
    `delete from guest_tag_assignments where guest_id = $1 and tag_id = $2`,
    [guestId, tagId]
  );
};

// =====================
// Invites
// =====================

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const listInvites = async (projectId, { siteId, guestId, groupId } = {}) => {
  let sql = `
    select i.id, i.project_id, i.site_id, i.guest_id, i.group_id, i.token_hash, 
           i.security_mode, i.expires_at, i.revoked_at, i.created_at,
           s.name as site_name,
           g.first_name as guest_first_name, g.last_name as guest_last_name,
           gg.name as group_name
    from invites i
    left join sites s on i.site_id = s.id
    left join guests g on i.guest_id = g.id
    left join guest_groups gg on i.group_id = gg.id
    where i.project_id = $1
  `;
  const params = [projectId];
  let paramIdx = 2;

  if (siteId) {
    sql += ` and i.site_id = $${paramIdx++}`;
    params.push(siteId);
  }
  if (guestId) {
    sql += ` and i.guest_id = $${paramIdx++}`;
    params.push(guestId);
  }
  if (groupId) {
    sql += ` and i.group_id = $${paramIdx++}`;
    params.push(groupId);
  }

  sql += ` order by i.created_at desc`;

  const result = await query(sql, params);
  return result.rows;
};

const getInviteById = async (inviteId) => {
  const result = await query(
    `select i.id, i.project_id, i.site_id, i.guest_id, i.group_id, i.token_hash, 
            i.security_mode, i.passcode_hash, i.expires_at, i.revoked_at, i.created_at,
            s.name as site_name,
            g.first_name as guest_first_name, g.last_name as guest_last_name,
            gg.name as group_name
     from invites i
     left join sites s on i.site_id = s.id
     left join guests g on i.guest_id = g.id
     left join guest_groups gg on i.group_id = gg.id
     where i.id = $1`,
    [inviteId]
  );
  return result.rows[0] || null;
};

const getInviteByToken = async (token) => {
  const tokenHash = hashToken(token);
  const result = await query(
    `select i.id, i.project_id, i.site_id, i.guest_id, i.group_id, i.token_hash, 
            i.security_mode, i.passcode_hash, i.expires_at, i.revoked_at, i.created_at,
            s.name as site_name,
            g.first_name as guest_first_name, g.last_name as guest_last_name,
            gg.name as group_name
     from invites i
     left join sites s on i.site_id = s.id
     left join guests g on i.guest_id = g.id
     left join guest_groups gg on i.group_id = gg.id
     where i.token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

const createInvite = async ({
  projectId,
  siteId,
  guestId,
  groupId,
  securityMode,
  passcode,
  expiresAt
}) => {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const passcodeHash = passcode
    ? crypto.createHash("sha256").update(passcode).digest("hex")
    : null;

  const result = await query(
    `insert into invites (project_id, site_id, guest_id, group_id, token_hash, 
                          security_mode, passcode_hash, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [
      projectId,
      siteId,
      guestId || null,
      groupId || null,
      tokenHash,
      securityMode || "OPEN",
      passcodeHash,
      expiresAt || null
    ]
  );

  return {
    id: result.rows[0]?.id,
    token
  };
};

const revokeInvite = async (inviteId) => {
  await query(
    `update invites set revoked_at = now() where id = $1`,
    [inviteId]
  );
};

const regenerateInviteToken = async (inviteId) => {
  const token = generateToken();
  const tokenHash = hashToken(token);

  await query(
    `update invites set token_hash = $1, revoked_at = null where id = $2`,
    [tokenHash, inviteId]
  );

  return token;
};

const logInviteAccess = async (inviteId, { ipAddress, userAgent }) => {
  await query(
    `insert into invite_access_logs (invite_id, ip_address, user_agent)
     values ($1, $2, $3)`,
    [inviteId, ipAddress || null, userAgent || null]
  );
};

const getInviteAccessLogs = async (inviteId) => {
  const result = await query(
    `select id, accessed_at, ip_address, user_agent
     from invite_access_logs
     where invite_id = $1
     order by accessed_at desc`,
    [inviteId]
  );
  return result.rows;
};

// =====================
// RSVP Forms
// =====================

const listRsvpForms = async (projectId) => {
  const result = await query(
    `select id, project_id, name, created_at
     from rsvp_forms
     where project_id = $1
     order by created_at desc`,
    [projectId]
  );
  return result.rows;
};

const getRsvpFormById = async (formId) => {
  const result = await query(
    `select id, project_id, name, created_at
     from rsvp_forms
     where id = $1`,
    [formId]
  );
  return result.rows[0] || null;
};

const getRsvpFormWithQuestions = async (formId) => {
  const formResult = await query(
    `select id, project_id, name, created_at
     from rsvp_forms
     where id = $1`,
    [formId]
  );

  if (!formResult.rows[0]) {
    return null;
  }

  const questionsResult = await query(
    `select q.id, q.event_id, q.label, q.help_text, q.type, q.required, q.sort_order,
            e.name as event_name,
            coalesce(json_agg(
              jsonb_build_object('id', o.id, 'label', o.label, 'value', o.value, 'sort_order', o.sort_order)
              order by o.sort_order
            ) filter (where o.id is not null), '[]') as options
     from rsvp_questions q
     left join events e on q.event_id = e.id
     left join rsvp_question_options o on o.question_id = q.id
     where q.form_id = $1
     group by q.id, e.name
     order by q.sort_order, q.created_at`,
    [formId]
  );

  const logicResult = await query(
    `select id, question_id, depends_on_question_id, operator, value
     from rsvp_logic_rules
     where question_id in (select id from rsvp_questions where form_id = $1)`,
    [formId]
  );

  return {
    ...formResult.rows[0],
    questions: questionsResult.rows.map((q) => ({
      ...q,
      logic_rules: logicResult.rows.filter((r) => r.question_id === q.id)
    }))
  };
};

const createRsvpForm = async (projectId, name) => {
  const result = await query(
    `insert into rsvp_forms (project_id, name) values ($1, $2) returning id`,
    [projectId, name]
  );
  return result.rows[0]?.id;
};

const deleteRsvpForm = async (formId) => {
  await query("delete from rsvp_forms where id = $1", [formId]);
};

// =====================
// RSVP Questions
// =====================

const createRsvpQuestion = async ({
  formId,
  eventId,
  label,
  helpText,
  type,
  required,
  sortOrder
}) => {
  const result = await query(
    `insert into rsvp_questions (form_id, event_id, label, help_text, type, required, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [formId, eventId || null, label, helpText || null, type, required || false, sortOrder || 0]
  );
  return result.rows[0]?.id;
};

const updateRsvpQuestion = async (questionId, updates) => {
  const fields = [];
  const values = [];
  let paramIdx = 1;

  if (updates.label !== undefined) {
    fields.push(`label = $${paramIdx++}`);
    values.push(updates.label);
  }
  if (updates.helpText !== undefined) {
    fields.push(`help_text = $${paramIdx++}`);
    values.push(updates.helpText);
  }
  if (updates.type !== undefined) {
    fields.push(`type = $${paramIdx++}`);
    values.push(updates.type);
  }
  if (updates.required !== undefined) {
    fields.push(`required = $${paramIdx++}`);
    values.push(updates.required);
  }
  if (updates.sortOrder !== undefined) {
    fields.push(`sort_order = $${paramIdx++}`);
    values.push(updates.sortOrder);
  }
  if (updates.eventId !== undefined) {
    fields.push(`event_id = $${paramIdx++}`);
    values.push(updates.eventId);
  }

  if (fields.length === 0) return null;

  values.push(questionId);
  const result = await query(
    `update rsvp_questions set ${fields.join(", ")} where id = $${paramIdx} returning id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deleteRsvpQuestion = async (questionId) => {
  await query("delete from rsvp_questions where id = $1", [questionId]);
};

// =====================
// RSVP Question Options
// =====================

const createQuestionOption = async (questionId, { label, value, sortOrder }) => {
  const result = await query(
    `insert into rsvp_question_options (question_id, label, value, sort_order)
     values ($1, $2, $3, $4)
     returning id`,
    [questionId, label, value, sortOrder || 0]
  );
  return result.rows[0]?.id;
};

const deleteQuestionOption = async (optionId) => {
  await query("delete from rsvp_question_options where id = $1", [optionId]);
};

// =====================
// RSVP Logic Rules
// =====================

const createLogicRule = async ({ questionId, dependsOnQuestionId, operator, value }) => {
  const result = await query(
    `insert into rsvp_logic_rules (question_id, depends_on_question_id, operator, value)
     values ($1, $2, $3, $4)
     returning id`,
    [questionId, dependsOnQuestionId, operator, value]
  );
  return result.rows[0]?.id;
};

const deleteLogicRule = async (ruleId) => {
  await query("delete from rsvp_logic_rules where id = $1", [ruleId]);
};

// =====================
// RSVP Submissions & Answers
// =====================

const createRsvpSubmission = async ({ formId, inviteId, guestId, channel }) => {
  const result = await query(
    `insert into rsvp_submissions (form_id, invite_id, guest_id, channel)
     values ($1, $2, $3, $4)
     returning id`,
    [formId, inviteId || null, guestId || null, channel || null]
  );
  return result.rows[0]?.id;
};

const createRsvpAnswer = async ({ submissionId, questionId, answerText, answerJson }) => {
  const result = await query(
    `insert into rsvp_answers (submission_id, question_id, answer_text, answer_json)
     values ($1, $2, $3, $4)
     returning id`,
    [submissionId, questionId, answerText || null, answerJson ? JSON.stringify(answerJson) : null]
  );
  return result.rows[0]?.id;
};

const getRsvpSubmissions = async (formId, { inviteId, guestId } = {}) => {
  let sql = `
    select s.id, s.form_id, s.invite_id, s.guest_id, s.submitted_at, s.channel,
           i.token_hash,
           g.first_name as guest_first_name, g.last_name as guest_last_name
    from rsvp_submissions s
    left join invites i on s.invite_id = i.id
    left join guests g on s.guest_id = g.id
    where s.form_id = $1
  `;
  const params = [formId];
  let paramIdx = 2;

  if (inviteId) {
    sql += ` and s.invite_id = $${paramIdx++}`;
    params.push(inviteId);
  }
  if (guestId) {
    sql += ` and s.guest_id = $${paramIdx++}`;
    params.push(guestId);
  }

  sql += ` order by s.submitted_at desc`;

  const result = await query(sql, params);
  return result.rows;
};

const getRsvpSubmissionWithAnswers = async (submissionId) => {
  const submissionResult = await query(
    `select s.id, s.form_id, s.invite_id, s.guest_id, s.submitted_at, s.channel,
            i.token_hash,
            g.first_name as guest_first_name, g.last_name as guest_last_name
     from rsvp_submissions s
     left join invites i on s.invite_id = i.id
     left join guests g on s.guest_id = g.id
     where s.id = $1`,
    [submissionId]
  );

  if (!submissionResult.rows[0]) {
    return null;
  }

  const answersResult = await query(
    `select a.id, a.question_id, a.answer_text, a.answer_json,
            q.label as question_label, q.type as question_type
     from rsvp_answers a
     join rsvp_questions q on a.question_id = q.id
     where a.submission_id = $1`,
    [submissionId]
  );

  return {
    ...submissionResult.rows[0],
    answers: answersResult.rows
  };
};

module.exports = {
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
  hashToken,

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
};
