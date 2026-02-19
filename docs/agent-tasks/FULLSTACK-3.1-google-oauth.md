# Full-Stack Agent A: Google OAuth Integration
**Task ID:** FULLSTACK-3.1  
**Priority:** Medium  
**Estimated Time:** 4-6 hours

## Objective
Implement Google Sign-In and Sign-Up functionality.

## Prerequisites
1. Google Cloud Console project created
2. OAuth 2.0 credentials obtained (Client ID and Secret)
3. Authorized redirect URIs configured:
   - `https://api.railway.app/auth/google/callback`
   - `http://localhost:4000/auth/google/callback` (dev)

## Backend Implementation

### Install Dependencies
```bash
npm install passport-google-oauth20
```

### Create OAuth Strategy
File: `apps/api/src/modules/auth/oauth.js`

```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (fastify) {
  const userService = require('./service')(fastify);

  fastify.register(require('@fastify/passport'));
  
  fastify.passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const user = await userService.findOrCreateOAuthUser({
        email,
        name: profile.displayName,
        provider: 'google',
        providerId: profile.id,
        avatar: profile.photos[0]?.value,
      });
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }));

  return {
    googleAuth: fastify.passport.authenticate('google', {
      scope: ['profile', 'email']
    }),
    googleCallback: fastify.passport.authenticate('google', {
      failureRedirect: '/auth/login?error=oauth_failed'
    }),
  };
};
```

### Add Routes
File: `apps/api/src/modules/auth/routes.js`

```javascript
const oauth = require('./oauth')(fastify);

// Google OAuth routes
fastify.get('/auth/google', oauth.googleAuth);

fastify.get('/auth/google/callback', {
  handler: async (request, reply) => {
    const user = request.user;
    const token = await authService.generateToken(user);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
    return reply.redirect(redirectUrl);
  },
  preValidation: oauth.googleCallback,
});
```

### Handle User Creation
In `auth/service.js`, add:

```javascript
async findOrCreateOAuthUser({ email, name, provider, providerId, avatar }) {
  // Check if user exists
  let user = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (user.rows.length === 0) {
    // Create new user
    const result = await this.db.query(`
      INSERT INTO users (email, full_name, avatar_url, ${provider}_id, email_verified)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [email, name, avatar, providerId]);
    user = result;
  }
  
  return user.rows[0];
}
```

## Frontend Implementation

### Update Google Button
File: `apps/web/app/auth/login/page.tsx`

Replace the "Coming soon" toast with actual OAuth redirect:

```typescript
const handleGoogleLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
};

// In JSX:
<Button
  variant="outline"
  className="h-11"
  onClick={handleGoogleLogin}
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Google SVG */}
  </svg>
</Button>
```

### Create OAuth Callback Handler
File: `apps/web/app/auth/callback/page.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    
    if (error) {
      router.push("/auth/login?error=oauth_failed");
      return;
    }
    
    if (token) {
      setToken(token);
      router.push("/dashboard");
    }
  }, [searchParams, router, setToken]);
  
  return <div>Completing sign in...</div>;
}
```

## Environment Variables

Add to `.env.railway`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
FRONTEND_URL=https://invitation-production-db10.up.railway.app
```

## Testing

1. Click Google button on login page
2. Should redirect to Google consent screen
3. After consent, should redirect back to dashboard
4. User should be created in database
5. Subsequent logins should use existing user
