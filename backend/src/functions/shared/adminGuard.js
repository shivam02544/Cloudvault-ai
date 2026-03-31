const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Returns the claims object from the event's authorizer context.
 * Supports HTTP API v2 (jwt.claims) and v1 (claims) formats.
 */
function getClaims(event) {
  const authorizer = event.requestContext?.authorizer || {};
  return authorizer.jwt?.claims || authorizer.claims || null;
}

/**
 * Checks that the caller is an authenticated admin.
 * Returns null if the caller is an admin (proceed).
 * Returns a 401 response object if JWT/claims are absent.
 * Returns a 403 response object if claims are present but no "admin" group.
 */
function adminGuard(event) {
  const claims = getClaims(event);

  if (!claims) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const groupList = [];
  ['cognito:groups', 'groups', 'custom:groups', 'roles'].forEach((key) => {
    const val = claims[key];
    if (Array.isArray(val)) {
      groupList.push(...val);
    } else if (typeof val === 'string') {
      if (val.startsWith('[')) {
        try { groupList.push(...JSON.parse(val)); } catch (_) { groupList.push(val); }
      } else {
        // Plain string — could be "admin" or comma-separated "admin,users"
        val.split(',').map(s => s.trim()).filter(Boolean).forEach(g => groupList.push(g));
      }
    }
  });

  const isAdmin = groupList.includes('admin') || claims['cognito:groups']?.includes('admin');

  if (!isAdmin) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Access Denied', message: 'Admin privileges required' }),
    };
  }

  return null;
}

module.exports = { adminGuard, getClaims };
