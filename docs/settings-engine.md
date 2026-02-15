# Settings Engine and Entitlements Model

## Goals
- Data-driven settings with hierarchical overrides.
- Plan entitlements gate what values are allowed.
- Deterministic, cacheable resolution per request.

## Hierarchy (Lowest to Highest Priority)
1. Platform defaults (from `settings_definitions.default_value`)
2. Platform overrides (`settings_values` at scope `PLATFORM`)
3. Plan defaults (from `plan_entitlements`)
4. Org overrides (`settings_values` at scope `ORG`)
5. Project overrides (`settings_values` at scope `PROJECT`)
6. Event overrides (`settings_values` at scope `EVENT`)
7. Invite overrides (`settings_values` at scope `INVITE`)

## Settings Definition Shape
Each setting is defined once and validated everywhere.

```
{
  "key": "invite.security_mode",
  "value_type": "ENUM",
  "default_value": "OPEN",
  "allowed_values": ["OPEN", "LINK_LOCKED", "PASSCODE", "OTP_FIRST_TIME", "OTP_EVERY_SESSION", "OTP_EVERY_TIME"],
  "scope_min": "PLATFORM",
  "scope_max": "INVITE",
  "entitlements_key": "sms.otp.enabled",
  "entitlements_values": ["OTP_FIRST_TIME", "OTP_EVERY_SESSION", "OTP_EVERY_TIME"]
}
```

## Entitlements
- Plans define entitlements in `plan_entitlements` (per plan).
- Optional overrides in `entitlement_overrides` (per org or project).
- Entitlements return typed values (boolean/number/json) used by settings validation.

## Resolution Algorithm (High Level)
1. Load setting definition.
2. Start with `default_value`.
3. Apply overrides by ascending scope priority.
4. Validate type and allowed values.
5. Enforce entitlements gating:
   - If value requires entitlement and entitlement is missing/false, fall back to the nearest allowed value.
6. Return resolved value + source scope for audit/debug.

## Example: RSVP Search Privacy
- Key: `rsvp.search.privacy_mode`
- Allowed: `LOW`, `MEDIUM`, `HIGH`
- If plan allows only `LOW` and `MEDIUM`, `HIGH` is rejected and downgraded to `MEDIUM`.

## Caching Strategy
- Resolve settings on read with a cache key of:
  `settings:{project_id}:{event_id}:{invite_id}:{settings_version}`
- Increment `settings_version` on any settings update at any scope.

