# EIOS API Plugins

This directory contains Fastify plugins for the Event Invitation OS API.

## Plugin Overview

| Plugin | Purpose |
|--------|---------|
| `cors.js` | Cross-Origin Resource Sharing configuration |
| `security.js` | Helmet security headers + Redis-backed rate limiting |
| `logger.js` | Request logging with correlation ID injection |
| `error-handler.js` | Centralized error handling with consistent responses |
| `module-loader.js` | Domain module auto-loading system |
| `swagger.js` | OpenAPI 3.0 documentation with Swagger UI at `/docs` |

## Usage

Plugins are automatically registered by the main server in `index.js`:

```javascript
await registerCorePlugins(fastify);
```

## Plugin Details

### CORS (`cors.js`)
- Configurable allowed origins (array, boolean, or function)
- Supports credentials and custom headers
- Environment-based configuration

### Security (`security.js`)
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Rate Limit**: Redis-backed distributed rate limiting
  - Per-endpoint overrides via config
  - IP-based or user-based keys
  - Automatic fallback to memory store

### Logger (`logger.js`)
- Correlation ID generation/propagation
- Request/response timing
- Audit logging helper
- Automatic context extraction

### Error Handler (`error-handler.js`)
- `ApiError` class for operational errors
- Database error code mapping
- Consistent error response format
- Stack traces in development only

### Module Loader (`module-loader.js`)
- Auto-discovers domain modules from `src/modules/`
- Supports explicit register function or route exports
- Configurable route prefixes
- Graceful error handling

### Swagger (`swagger.js`)
- OpenAPI 3.0.3 spec generation with `@fastify/swagger`
- Interactive Swagger UI at `/docs` via `@fastify/swagger-ui`
- Reusable schemas for common types (User, Project, Guest, etc.)
- Authentication support (Bearer token + Cookie)
- Organized by tags: Auth, Projects, Guests, Invites, RSVP, Sites, Messaging, Settings, Admin, Seating, Check-in, Photos, Analytics, System

## Creating a Domain Module

Example module structure:

```javascript
// src/modules/my-module/index.js
module.exports = {
  name: "MyModule",
  prefix: "/my-module",
  
  async register(fastify, options) {
    fastify.get("/", async (request, reply) => {
      return { message: "Hello from MyModule" };
    });
  }
};
```

Or with explicit routes:

```javascript
// src/modules/my-module/routes.js
module.exports = {
  name: "MyModule",
  prefix: "/my-module",
  
  routes: [
    {
      method: "GET",
      url: "/",
      handler: async (request, reply) => {
        return { message: "Hello" };
      }
    }
  ]
};
```
