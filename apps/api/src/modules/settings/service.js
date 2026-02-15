const path = require("path");
const {
  getEntitlementsForContext,
  getSettingsOverridesForContext,
  upsertSettingsValue,
  listSettingsValues
} = require("./repository");

const sharedPath = path.join(__dirname, "../../../../../packages/shared/src");
const { getDefinition, resolveSetting } = require(sharedPath);

const resolveSettingForContext = async ({
  key,
  projectId,
  eventId,
  inviteId,
  orgId
}) => {
  const definition = getDefinition(key);
  if (!definition) {
    return null;
  }

  const entitlements = await getEntitlementsForContext({ projectId, orgId });
  const overrides = await getSettingsOverridesForContext({
    key,
    projectId,
    eventId,
    inviteId,
    orgId
  });

  return resolveSetting(definition, overrides, entitlements);
};

const setSettingsValue = async ({ scope, scopeId, key, value, updatedBy }) => {
  if (!scope || !key) {
    throw new Error("scope and key are required");
  }
  return upsertSettingsValue({ scope, scopeId, key, value, updatedBy });
};

const getSettingsValues = async ({ scope, scopeId, key }) => {
  if (!scope) {
    throw new Error("scope is required");
  }
  if (scope !== "PLATFORM" && !scopeId) {
    throw new Error("scopeId is required for non-PLATFORM scopes");
  }
  return listSettingsValues({ scope, scopeId, key });
};

module.exports = {
  resolveSettingForContext,
  setSettingsValue,
  getSettingsValues
};
