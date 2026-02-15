const { isEntitled } = require("./entitlements");

const SCOPE_PRIORITY = [
  "PLATFORM",
  "PLAN",
  "ORG",
  "PROJECT",
  "EVENT",
  "INVITE"
];

const isValueTypeValid = (valueType, value) => {
  if (valueType === "BOOLEAN") {
    return typeof value === "boolean";
  }
  if (valueType === "NUMBER") {
    return typeof value === "number" && !Number.isNaN(value);
  }
  if (valueType === "STRING") {
    return typeof value === "string";
  }
  if (valueType === "ENUM") {
    return typeof value === "string";
  }
  if (valueType === "JSON") {
    return value !== undefined;
  }
  return false;
};

const isAllowedValue = (value, allowedValues) => {
  if (!allowedValues || allowedValues.length === 0) {
    return true;
  }
  return allowedValues.includes(value);
};

const pickFallbackValue = (definition, entitlements) => {
  const allowedValues = definition.allowedValues || [];
  const restrictedValues = new Set(definition.entitlementsValues || []);
  const entitled = isEntitled(entitlements, definition.entitlementsKey);

  if (entitled) {
    return definition.defaultValue;
  }

  if (allowedValues.length > 0) {
    const fallback = allowedValues.find((value) => !restrictedValues.has(value));
    return fallback !== undefined ? fallback : definition.defaultValue;
  }

  return definition.defaultValue;
};

const sortOverrides = (overrides) => {
  const priority = new Map(
    SCOPE_PRIORITY.map((scope, index) => [scope, index])
  );
  return [...overrides].sort((a, b) => {
    return (priority.get(a.scope) ?? 999) - (priority.get(b.scope) ?? 999);
  });
};

const resolveSetting = (definition, overrides = [], entitlements = {}) => {
  let resolvedValue = definition.defaultValue;
  let sourceScope = "PLATFORM_DEFAULT";

  const orderedOverrides = sortOverrides(overrides);

  for (const override of orderedOverrides) {
    if (!override || override.value === undefined) {
      continue;
    }
    if (!isValueTypeValid(definition.valueType, override.value)) {
      continue;
    }
    if (!isAllowedValue(override.value, definition.allowedValues)) {
      continue;
    }
    resolvedValue = override.value;
    sourceScope = override.scope || sourceScope;
  }

  if (definition.entitlementsKey && definition.entitlementsValues) {
    const entitled = isEntitled(entitlements, definition.entitlementsKey);
    if (!entitled && definition.entitlementsValues.includes(resolvedValue)) {
      resolvedValue = pickFallbackValue(definition, entitlements);
      sourceScope = "ENTITLEMENT_FALLBACK";
    }
  }

  return {
    key: definition.key,
    value: resolvedValue,
    sourceScope
  };
};

module.exports = {
  resolveSetting,
  SCOPE_PRIORITY
};
