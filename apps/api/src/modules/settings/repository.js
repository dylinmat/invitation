const { query } = require("../../db");

const fetchProjectOwnerOrgId = async (projectId) => {
  const result = await query(
    "select owner_org_id from projects where id = $1",
    [projectId]
  );
  return result.rows[0]?.owner_org_id || null;
};

const fetchPlanIdForProject = async (projectId) => {
  const result = await query(
    `select plan_id
     from project_plan_assignments
     where project_id = $1
     order by starts_at desc nulls last
     limit 1`,
    [projectId]
  );
  return result.rows[0]?.plan_id || null;
};

const fetchPlanIdForOrg = async (orgId) => {
  const result = await query(
    `select plan_id
     from org_plan_assignments
     where org_id = $1
     order by starts_at desc nulls last
     limit 1`,
    [orgId]
  );
  return result.rows[0]?.plan_id || null;
};

const fetchPlanEntitlements = async (planId) => {
  if (!planId) {
    return {};
  }
  const result = await query(
    "select key, value_json from plan_entitlements where plan_id = $1",
    [planId]
  );
  return result.rows.reduce((acc, row) => {
    acc[row.key] = row.value_json;
    return acc;
  }, {});
};

const fetchEntitlementOverrides = async (scope, scopeId) => {
  if (!scopeId) {
    return {};
  }
  const result = await query(
    "select key, value_json from entitlement_overrides where scope = $1 and scope_id = $2",
    [scope, scopeId]
  );
  return result.rows.reduce((acc, row) => {
    acc[row.key] = row.value_json;
    return acc;
  }, {});
};

const fetchSettingsOverrides = async (key, scopeMap) => {
  const scopes = Object.keys(scopeMap);
  if (!scopes.length) {
    return [];
  }
  const result = await query(
    "select scope, scope_id, value from settings_values where key = $1 and scope = any($2)",
    [key, scopes]
  );
  return result.rows
    .filter((row) => {
      const expectedId = scopeMap[row.scope];
      if (row.scope === "PLATFORM") {
        return row.scope_id === null;
      }
      return expectedId && String(row.scope_id) === String(expectedId);
    })
    .map((row) => ({
      scope: row.scope,
      value: row.value
    }));
};

const upsertSettingsValue = async ({
  scope,
  scopeId,
  key,
  value,
  updatedBy
}) => {
  const serializedValue =
    value === undefined ? null : JSON.stringify(value);
  const result = await query(
    `insert into settings_values (scope, scope_id, key, value, updated_by)
     values ($1, $2, $3, $4, $5)
     on conflict (scope, scope_id, key)
     do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()
     returning id`,
    [scope, scopeId || null, key, serializedValue, updatedBy || null]
  );
  return result.rows[0]?.id;
};

const listSettingsValues = async ({ scope, scopeId, key }) => {
  const params = [scope, scopeId || null];
  let sql =
    "select scope, scope_id, key, value, updated_at from settings_values where scope = $1 and scope_id is not distinct from $2";

  if (key) {
    params.push(key);
    sql += " and key = $3";
  }

  const result = await query(sql, params);
  return result.rows;
};

const getEntitlementsForContext = async ({ projectId, orgId }) => {
  let resolvedOrgId = orgId;
  if (!resolvedOrgId && projectId) {
    resolvedOrgId = await fetchProjectOwnerOrgId(projectId);
  }

  const projectPlanId = projectId
    ? await fetchPlanIdForProject(projectId)
    : null;
  const orgPlanId = resolvedOrgId
    ? await fetchPlanIdForOrg(resolvedOrgId)
    : null;
  const planId = projectPlanId || orgPlanId;

  const entitlements = await fetchPlanEntitlements(planId);
  const orgOverrides = await fetchEntitlementOverrides("ORG", resolvedOrgId);
  const projectOverrides = await fetchEntitlementOverrides("PROJECT", projectId);

  return {
    ...entitlements,
    ...orgOverrides,
    ...projectOverrides
  };
};

const getSettingsOverridesForContext = async ({
  key,
  projectId,
  eventId,
  inviteId,
  orgId
}) => {
  let resolvedOrgId = orgId;
  if (!resolvedOrgId && projectId) {
    resolvedOrgId = await fetchProjectOwnerOrgId(projectId);
  }

  const projectPlanId = projectId
    ? await fetchPlanIdForProject(projectId)
    : null;
  const orgPlanId = resolvedOrgId
    ? await fetchPlanIdForOrg(resolvedOrgId)
    : null;
  const planId = projectPlanId || orgPlanId;

  const scopeMap = {
    PLATFORM: null,
    PLAN: planId || null,
    ORG: resolvedOrgId || null,
    PROJECT: projectId || null,
    EVENT: eventId || null,
    INVITE: inviteId || null
  };

  return fetchSettingsOverrides(key, scopeMap);
};

module.exports = {
  getEntitlementsForContext,
  getSettingsOverridesForContext,
  upsertSettingsValue,
  listSettingsValues
};
