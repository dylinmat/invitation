const { query } = require("../../db");

const createPlan = async ({ code, name }) => {
  const result = await query(
    `insert into plans (code, name)
     values ($1, $2)
     returning id`,
    [code, name]
  );
  return result.rows[0]?.id;
};

const listPlans = async () => {
  const result = await query("select id, code, name from plans order by name");
  return result.rows;
};

const assignPlanToOrg = async ({ orgId, planId, startsAt, endsAt }) => {
  const result = await query(
    `insert into org_plan_assignments (org_id, plan_id, starts_at, ends_at)
     values ($1, $2, $3, $4)
     on conflict (org_id, plan_id)
     do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at
     returning id`,
    [orgId, planId, startsAt || null, endsAt || null]
  );
  return result.rows[0]?.id;
};

const assignPlanToProject = async ({ projectId, planId, startsAt, endsAt }) => {
  const result = await query(
    `insert into project_plan_assignments (project_id, plan_id, starts_at, ends_at)
     values ($1, $2, $3, $4)
     on conflict (project_id, plan_id)
     do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at
     returning id`,
    [projectId, planId, startsAt || null, endsAt || null]
  );
  return result.rows[0]?.id;
};

const listOrgPlans = async (orgId) => {
  const result = await query(
    `select org_id, plan_id, starts_at, ends_at
     from org_plan_assignments
     where org_id = $1`,
    [orgId]
  );
  return result.rows;
};

const listProjectPlans = async (projectId) => {
  const result = await query(
    `select project_id, plan_id, starts_at, ends_at
     from project_plan_assignments
     where project_id = $1`,
    [projectId]
  );
  return result.rows;
};

const upsertPlanEntitlement = async ({ planId, key, valueJson }) => {
  const serializedValue =
    valueJson === undefined ? null : JSON.stringify(valueJson);
  const result = await query(
    `insert into plan_entitlements (plan_id, key, value_json, updated_at)
     values ($1, $2, $3, now())
     on conflict (plan_id, key)
     do update set value_json = excluded.value_json, updated_at = now()
     returning id`,
    [planId, key, serializedValue]
  );
  return result.rows[0]?.id;
};

const listPlanEntitlements = async (planId) => {
  const result = await query(
    "select key, value_json from plan_entitlements where plan_id = $1",
    [planId]
  );
  return result.rows;
};

const upsertEntitlementOverride = async ({
  scope,
  scopeId,
  key,
  valueJson
}) => {
  const serializedValue =
    valueJson === undefined ? null : JSON.stringify(valueJson);
  const result = await query(
    `insert into entitlement_overrides (scope, scope_id, key, value_json)
     values ($1, $2, $3, $4)
     on conflict (scope, scope_id, key)
     do update set value_json = excluded.value_json, updated_at = now()
     returning id`,
    [scope, scopeId || null, key, serializedValue]
  );
  return result.rows[0]?.id;
};

const listEntitlementOverrides = async ({ scope, scopeId }) => {
  const result = await query(
    "select key, value_json from entitlement_overrides where scope = $1 and scope_id is not distinct from $2",
    [scope, scopeId || null]
  );
  return result.rows;
};

module.exports = {
  createPlan,
  listPlans,
  assignPlanToOrg,
  assignPlanToProject,
  listOrgPlans,
  listProjectPlans,
  upsertPlanEntitlement,
  listPlanEntitlements,
  upsertEntitlementOverride,
  listEntitlementOverrides
};
