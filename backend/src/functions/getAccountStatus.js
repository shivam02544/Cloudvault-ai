'use strict';

/**
 * Returns the current account status for the logged-in user.
 * Used by ProtectedRoute to gate access.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const res = await docClient.send(new GetCommand({
      TableName: process.env.FILE_TABLE,
      Key: { userId, fileId: '__STATS__' },
    }));

    if (!res.Item) {
      // No STATS record yet — treat as pending (user hasn't called /auth/register yet)
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'pending' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: res.Item.status || 'active',
        registeredAt: res.Item.registeredAt || null,
      }),
    };
  } catch (err) {
    console.error('GET_ACCOUNT_STATUS_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
