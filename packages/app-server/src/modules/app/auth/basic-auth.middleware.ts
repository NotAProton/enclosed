import type { Context } from '../server.types';
import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';
import { createMiddleware } from 'hono/factory';

export const basicAuthMiddleware = createMiddleware(async (context: Context, next) => {
  const {
    authentication: { basicAuthUsername, basicAuthPassword },
  } = context.get('config');

  // If basic auth is not configured, skip this middleware
  // Both username and password must be set to enable auth
  if (!basicAuthUsername || !basicAuthPassword) {
    return next();
  }

  const authHeader = context.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return context.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="Enclosed"',
    });
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

    // Split only on first colon to handle passwords with colons
    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) {
      return context.text('Unauthorized', 401, {
        'WWW-Authenticate': 'Basic realm="Enclosed"',
      });
    }

    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);

    // Use timing-safe comparison to prevent timing attacks
    const usernameMatch = timingSafeEqual(
      Buffer.from(username),
      Buffer.from(basicAuthUsername),
    );
    const passwordMatch = timingSafeEqual(
      Buffer.from(password),
      Buffer.from(basicAuthPassword),
    );

    if (usernameMatch && passwordMatch) {
      return next();
    }
  } catch {
    // Handle malformed credentials gracefully
  }

  return context.text('Unauthorized', 401, {
    'WWW-Authenticate': 'Basic realm="Enclosed"',
  });
});
