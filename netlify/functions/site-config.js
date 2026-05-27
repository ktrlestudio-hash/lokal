import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { readConfig, writeConfig } from './_lib/config-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const config = await readConfig();
      return jsonResponse(event, 200, config);
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      ensureAdmin(user);
      const body = parseJsonBody(event);
      const updated = await writeConfig(body);
      return jsonResponse(event, 200, updated);
    }

    return jsonResponse(event, 405, { error: 'Method not allowed' });
  } catch (err) {
    return handleError(event, err);
  }
};
