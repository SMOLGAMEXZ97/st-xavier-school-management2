import { Handler } from '@netlify/functions';
import { jsonResponse } from './utils/authMiddleware';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  const hasCredentials = Boolean(
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );

  return jsonResponse(200, {
    status: 'ok',
    service: 'St. Xavier Netlify Functions Trusted Backend',
    firebaseAdminConfigured: hasCredentials,
    timestamp: new Date().toISOString(),
  });
};
