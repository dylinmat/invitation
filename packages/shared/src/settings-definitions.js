const SETTINGS_DEFINITIONS = [
  {
    key: "site.visibility",
    valueType: "ENUM",
    defaultValue: "PUBLIC",
    allowedValues: ["PUBLIC", "UNLISTED", "INVITE_ONLY"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Controls public access to the site.",
    isPublic: true
  },
  {
    key: "rsvp.mode",
    valueType: "ENUM",
    defaultValue: "LINK",
    allowedValues: ["LINK", "SEARCH", "BOTH"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Controls how guests access RSVP.",
    isPublic: true
  },
  {
    key: "rsvp.search.privacy_mode",
    valueType: "ENUM",
    defaultValue: "LOW",
    allowedValues: ["LOW", "MEDIUM", "HIGH"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Controls RSVP search strictness."
  },
  {
    key: "invite.security_mode",
    valueType: "ENUM",
    defaultValue: "OPEN",
    allowedValues: [
      "OPEN",
      "LINK_LOCKED",
      "PASSCODE",
      "OTP_FIRST_TIME",
      "OTP_EVERY_SESSION",
      "OTP_EVERY_TIME"
    ],
    scopeMin: "PLATFORM",
    scopeMax: "INVITE",
    description: "Controls invite link security.",
    entitlementsKey: "sms.otp.enabled",
    entitlementsValues: ["OTP_FIRST_TIME", "OTP_EVERY_SESSION", "OTP_EVERY_TIME"]
  },
  {
    key: "otp.channels",
    valueType: "JSON",
    defaultValue: ["EMAIL"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "OTP channels allowed for the project."
  },
  {
    key: "album.enabled",
    valueType: "BOOLEAN",
    defaultValue: false,
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Enable photo wall album."
  },
  {
    key: "album.upload_access",
    valueType: "ENUM",
    defaultValue: "INVITE_TOKEN",
    allowedValues: ["LINK", "INVITE_TOKEN", "BOTH"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Controls who can upload."
  },
  {
    key: "album.moderation_mode",
    valueType: "ENUM",
    defaultValue: "APPROVAL",
    allowedValues: ["INSTANT", "APPROVAL"],
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Controls photo moderation."
  },
  {
    key: "album.family_friendly",
    valueType: "BOOLEAN",
    defaultValue: true,
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Apply stricter moderation."
  },
  {
    key: "prints.enabled",
    valueType: "BOOLEAN",
    defaultValue: false,
    scopeMin: "PLATFORM",
    scopeMax: "PROJECT",
    description: "Enable print shop module."
  },
  {
    key: "domains.purchase.enabled",
    valueType: "BOOLEAN",
    defaultValue: false,
    scopeMin: "PLATFORM",
    scopeMax: "PLAN",
    description: "Allow domain purchase."
  },
  {
    key: "domains.custom.enabled",
    valueType: "BOOLEAN",
    defaultValue: true,
    scopeMin: "PLATFORM",
    scopeMax: "PLAN",
    description: "Allow custom domains."
  },
  {
    key: "retention.days_after_event",
    valueType: "NUMBER",
    defaultValue: 365,
    scopeMin: "PLATFORM",
    scopeMax: "PLAN",
    description: "Retention window in days."
  },
  {
    key: "retention.archive_mode",
    valueType: "ENUM",
    defaultValue: "SNAPSHOT",
    allowedValues: ["SNAPSHOT", "ANONYMIZE", "DELETE"],
    scopeMin: "PLATFORM",
    scopeMax: "PLAN",
    description: "Archive behavior after retention."
  }
];

const SETTINGS_BY_KEY = new Map(
  SETTINGS_DEFINITIONS.map((definition) => [definition.key, definition])
);

const getDefinition = (key) => SETTINGS_BY_KEY.get(key);

const getPublicDefinitions = () => {
  return SETTINGS_DEFINITIONS.filter((definition) => definition.isPublic);
};

module.exports = {
  SETTINGS_DEFINITIONS,
  getDefinition,
  getPublicDefinitions
};
