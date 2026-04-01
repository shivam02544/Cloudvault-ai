'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { notificationId } = event.pathParameters || {};
  if (!notificationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'notificationId is required' }) };

  try {
    await docClient.send(new UpdateCommand({
      TableName: process.env.FILE_TABLE,
      Key: { userId, fileId: `__NOTIF__${notificationId}` },
      UpdateExpression: 'SET #read = :r',
      ExpressionAttributeNames: { '#read': 'read' },
      ExpressionAttributeValues: { ':r': true },
      ConditionExpression: 'attribute_exists(fileId)',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Notification not found' }) };
    }
    console.error('MARK_NOTIFICATION_READ_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
