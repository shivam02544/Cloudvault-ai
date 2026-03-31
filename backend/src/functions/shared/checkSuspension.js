const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Checks whether a user is blocked from performing operations.
 * - suspended: explicitly blocked by admin
 * - denied: registration was rejected
 * - pending: still awaiting approval (blocked from dashboard via ProtectedRoute, but API calls allowed)
 * Returns null if the user can proceed.
 */
async function checkSuspension(userId, docClient, tableName) {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId, fileId: '__STATS__' },
    })
  );

  const status = res.Item?.status;

  if (status === 'suspended') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Account suspended' }) };
  }
  if (status === 'denied') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Account access denied' }) };
  }

  // 'pending', 'active', undefined — all allowed at the API level
  // 'pending' is enforced at the frontend ProtectedRoute level only
  return null;
}

module.exports = { checkSuspension };
