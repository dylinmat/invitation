const { isEntitled } = require("./entitlements");
const { resolveSetting, SCOPE_PRIORITY } = require("./settings");
const {
  SETTINGS_DEFINITIONS,
  getDefinition,
  getPublicDefinitions
} = require("./settings-definitions");

module.exports = {
  isEntitled,
  resolveSetting,
  SCOPE_PRIORITY,
  SETTINGS_DEFINITIONS,
  getDefinition,
  getPublicDefinitions
};
