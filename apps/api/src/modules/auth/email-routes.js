/**
 * Email Routes Extension
 * Handles email resend endpoints
 */

const crypto = require('crypto');

module.exports = async function (fastify, opts) {
  const emailService = require('./email-service')(fastify);

  /**
   * POST /api/auth/resend-magic-link
   * Resend magic link email with rate limiting
   */
  fastify.post('/resend-magic-link', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { email } = request.body;
        const normalizedEmail = email.toLowerCase().trim();
        
        // Rate limiting check (3 per hour per email)
        const rateLimitKey = `resend_magic_link:${normalizedEmail}`;
        const attempts = await fastify.redis.get(rateLimitKey);
        
        if (attempts && parseInt(attempts) >= 3) {
          reply.status(429);
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again in 1 hour.'
          };
        }

        // Find user by email
        const userResult = await fastify.db.query(
          'SELECT * FROM users WHERE email = $1',
          [normalizedEmail]
        );

        // Always return success (don't reveal if email exists)
        if (userResult.rows.length === 0) {
          // Still increment rate limiter to prevent enumeration
          await fastify.redis.multi()
            .incr(rateLimitKey)
            .expire(rateLimitKey, 3600)
            .exec();

          return {
            success: true,
            message: 'If an account exists, a magic link has been sent.'
          };
        }

        const user = userResult.rows[0];

        // Generate new magic link token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Store token with 15 minute expiry
        await fastify.redis.setex(
          `magic_link:${tokenHash}`,
          900, // 15 minutes
          JSON.stringify({ email: normalizedEmail, userId: user.id })
        );

        // Send email
        await emailService.sendMagicLink({
          email: normalizedEmail,
          token,
          name: user.full_name
        });

        // Increment rate limiter
        await fastify.redis.multi()
          .incr(rateLimitKey)
          .expire(rateLimitKey, 3600)
          .exec();

        return {
          success: true,
          message: 'If an account exists, a magic link has been sent.'
        };

      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to send magic link'
        };
      }
    }
  });

  /**
   * POST /api/auth/resend-verification
   * Resend email verification link
   */
  fastify.post('/resend-verification', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { email } = request.body;
        const normalizedEmail = email.toLowerCase().trim();
        
        // Rate limiting (same as magic link)
        const rateLimitKey = `resend_verification:${normalizedEmail}`;
        const attempts = await fastify.redis.get(rateLimitKey);
        
        if (attempts && parseInt(attempts) >= 3) {
          reply.status(429);
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again in 1 hour.'
          };
        }

        // Find user
        const userResult = await fastify.db.query(
          'SELECT * FROM users WHERE email = $1',
          [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
          await fastify.redis.multi()
            .incr(rateLimitKey)
            .expire(rateLimitKey, 3600)
            .exec();

          return {
            success: true,
            message: 'If an account exists, a verification link has been sent.'
          };
        }

        const user = userResult.rows[0];

        // If already verified, still return success (don't reveal status)
        if (user.email_verified) {
          return {
            success: true,
            message: 'If an account exists, a verification link has been sent.'
          };
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Store token
        await fastify.redis.setex(
          `verification:${tokenHash}`,
          86400, // 24 hours
          JSON.stringify({ email: normalizedEmail, userId: user.id })
        );

        // Send verification email
        await emailService.sendVerificationEmail({
          email: normalizedEmail,
          token,
          name: user.full_name
        });

        // Increment rate limiter
        await fastify.redis.multi()
          .incr(rateLimitKey)
          .expire(rateLimitKey, 3600)
          .exec();

        return {
          success: true,
          message: 'If an account exists, a verification link has been sent.'
        };

      } catch (error) {
        fastify.log.error(error);
        reply.status(500);
        return {
          success: false,
          error: 'Failed to send verification email'
        };
      }
    }
  });
};
