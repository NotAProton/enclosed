import type { Context } from '../server.types';
import { createMiddleware } from 'hono/factory';

export const basicAuthMiddleware = createMiddleware(async (context: Context, next) => {
  const {
    authentication: { basicAuthUsername, basicAuthPassword },
  } = context.get('config');

  // If basic auth is not configured, skip this middleware
  if (!basicAuthUsername || !basicAuthPassword) {
    return next();
  }

  const authHeader = context.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return context.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="Enclosed"',
    });
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === basicAuthUsername && password === basicAuthPassword) {
    return next();
  }

  return context.text('Unauthorized', 401, {
    'WWW-Authenticate': 'Basic realm="Enclosed"',
  });
});
