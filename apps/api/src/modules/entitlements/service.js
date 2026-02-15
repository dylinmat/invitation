const {
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
} = require("./repository");
const { getEntitlementsForContext } = require("../settings/repository");

const createPlanEntry = async ({ code, name }) => {
  if (!code || !name) {
    throw new Error("code and name are required");
  }
  return createPlan({ code, name });
};

const setPlanEntitlement = async ({ planId, key, valueJson }) => {
  if (!planId || !key) {
    throw new Error("planId and key are required");
  }
  return upsertPlanEntitlement({ planId, key, valueJson });
};

const setOrgPlan = async ({ orgId, planId, startsAt, endsAt }) => {
  if (!orgId || !planId) {
    throw new Error("orgId and planId are required");
  }
  return assignPlanToOrg({ orgId, planId, startsAt, endsAt });
};

const setProjectPlan = async ({ projectId, planId, startsAt, endsAt }) => {
  if (!projectId || !planId) {
    throw new Error("projectId and planId are required");
  }
  return assignPlanToProject({ projectId, planId, startsAt, endsAt });
};

const setEntitlementOverride = async ({ scope, scopeId, key, valueJson }) => {
  if (!scope || !key) {
    throw new Error("scope and key are required");
  }
  return upsertEntitlementOverride({ scope, scopeId, key, valueJson });
};

const resolveEntitlements = async ({ projectId, orgId }) => {
  return getEntitlementsForContext({ projectId, orgId });
};

module.exports = {
  createPlanEntry,
  listPlans,
  setOrgPlan,
  setProjectPlan,
  listOrgPlans,
  listProjectPlans,
  setPlanEntitlement,
  listPlanEntitlements,
  setEntitlementOverride,
  listEntitlementOverrides,
  resolveEntitlements
};
