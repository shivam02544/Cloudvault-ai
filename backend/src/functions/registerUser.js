'use strict';

/**
 * Called immediately after a user verifies their email (Cognito OTP confirmed).
 * Creates the user's __STATS__ record with status = 'pending'.
 * This triggers the admin approval flow.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  const email = event.requestContext?.authorizer?.jwt?.claims?.email;

  if (!userId) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const tableName = process.env.FILE_TABLE;

  try {
    // Check if STATS record already exists (idempotent)
    const existing = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { userId, fileId: '__STATS__' },
    }));

    if (existing.Item) {
      // Already registered — return current status
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: existing.Item.status || 'active', alreadyRegistered: true }),
      };
    }

    // Create STATS record with pending status
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        fileId: '__STATS__',
        email: email || null,
        totalBytesUsed: 0,
        fileCount: 0,
        status: 'pending',
        registeredAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(fileId)', // prevent overwrite
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'pending' }),
    };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Race condition — record was just created, fetch and return it
      const rec = await docClient.send(new GetCommand({ TableName: tableName, Key: { userId, fileId: '__STATS__' } }));
      return { statusCode: 200, headers, body: JSON.stringify({ status: rec.Item?.status || 'pending' }) };
    }
    console.error('REGISTER_USER_ERROR:', err.name, err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error', detail: err.message }) };
  }
};
