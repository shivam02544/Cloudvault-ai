'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { adminGuard } = require('./shared/adminGuard');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  // 1. Admin guard
  const guardResponse = adminGuard(event);
  if (guardResponse !== null) return guardResponse;

  // 2. Extract userId
  const userId = event.pathParameters?.userId;

  // 3. Determine action from last path segment
  const rawPath = event.rawPath || event.requestContext?.http?.path || '';
  const lastSegment = rawPath.split('/').filter(Boolean).pop();

  let newStatus;
  if (lastSegment === 'suspend') {
    newStatus = 'suspended';
  } else if (lastSegment === 'activate') {
    newStatus = 'active';
  } else {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };
  }

  // 4. Update STATS_Record
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.FILE_TABLE,
        Key: { userId, fileId: '__STATS__' },
        UpdateExpression: 'SET #status = :newStatus',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':newStatus': newStatus },
        ConditionExpression: 'attribute_exists(fileId)',
      })
    );

    // 6. Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, userId, status: newStatus }),
    };
  } catch (err) {
    // 5. Condition check failed → user not found
    if (err.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // 7. All other errors
    console.error('ADMIN_SUSPEND_USER_ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
