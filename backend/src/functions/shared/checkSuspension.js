const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Checks whether a user is suspended.
 * Returns null if the user is active or has no STATS_Record (fail-open).
 * Returns a 403 response object if status === 'suspended'.
 */
async function checkSuspension(userId, docClient, tableName) {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId, fileId: '__STATS__' },
    })
  );

  if (res.Item && res.Item.status === 'suspended') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Account suspended' }),
    };
  }

  return null;
}

module.exports = { checkSuspension };
