'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { adminGuard } = require('./shared/adminGuard');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const guard = adminGuard(event);
  if (guard) return guard;

  const { userId } = event.pathParameters || {};
  if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Supported limits: storageLimit (bytes), allowedTypes (array of mime prefixes), maxFileSize (bytes)
  const { storageLimit, allowedTypes, maxFileSize, notes } = body;

  const updates = [];
  const values = {};
  const names = {};

  if (storageLimit !== undefined && storageLimit > 0) { updates.push('storageLimit = :sl'); values[':sl'] = storageLimit; }
  if (allowedTypes !== undefined && Array.isArray(allowedTypes)) { updates.push('allowedTypes = :at'); values[':at'] = allowedTypes; }
  if (maxFileSize !== undefined && maxFileSize > 0) { updates.push('maxFileSize = :mf'); values[':mf'] = maxFileSize; }
  if (notes !== undefined) { updates.push('#notes = :n'); values[':n'] = notes; names['#notes'] = 'notes'; }

  if (updates.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No limits provided' }) };
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: process.env.FILE_TABLE,
      Key: { userId, fileId: '__STATS__' },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
      ConditionExpression: 'attribute_exists(fileId)',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, userId }) };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }
    console.error('ADMIN_SET_LIMITS_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
