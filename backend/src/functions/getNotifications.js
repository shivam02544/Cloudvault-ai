'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const res = await docClient.send(new QueryCommand({
      TableName: process.env.FILE_TABLE,
      KeyConditionExpression: 'userId = :uid AND begins_with(fileId, :prefix)',
      ExpressionAttributeValues: { ':uid': userId, ':prefix': '__NOTIF__' },
    }));

    const notifications = (res.Items || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(n => ({
        notificationId: n.notificationId,
        subject: n.subject,
        message: n.message,
        type: n.type || 'info',
        createdAt: n.createdAt,
        read: n.read || false,
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ notifications }) };
  } catch (err) {
    console.error('GET_NOTIFICATIONS_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
