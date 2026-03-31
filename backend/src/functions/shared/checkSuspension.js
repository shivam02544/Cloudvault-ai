const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Checks whether a user is blocked (suspended, pending, or denied).
 * Returns null if the user is active or has no STATS_Record (fail-open for new users).
 * Returns a 403 response object if the account is not active.
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
  if (status === 'pending') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Account pending approval' }) };
  }
  if (status === 'denied') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Account access denied' }) };
  }

  return null;
}

module.exports = { checkSuspension };
