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

  // Direct check — Cognito HTTP API JWT authorizer passes groups as 'groups' key
  const rawGroups = claims['cognito:groups'] || claims['groups'] || [];
  
  let groupList = [];
  if (Array.isArray(rawGroups)) {
    groupList = rawGroups;
  } else if (typeof rawGroups === 'string') {
    // Handle cases like '["admin"]', "[admin]", or "admin, user"
    if (rawGroups.includes('[')) {
      try {
        groupList = JSON.parse(rawGroups);
      } catch (e) {
        // Fallback: strip brackets and split
        groupList = rawGroups.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
      }
    } else {
      groupList = rawGroups.split(',').map(s => s.trim());
    }
  }
  
  const isAdmin = groupList.filter(Boolean).includes('admin');

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
