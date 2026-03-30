const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // 1. RBAC Check (Cognito Groups)
    const authorizer = event.requestContext?.authorizer || {};
    const claims = authorizer.jwt?.claims || authorizer.claims || {};
    
    const groupList = [];
    ['cognito:groups', 'groups', 'custom:groups', 'roles'].forEach(key => {
      const val = claims[key];
      if (Array.isArray(val)) groupList.push(...val);
      else if (typeof val === 'string') groupList.push(val);
    });

    const isAdmin = groupList.includes('admin') || claims['cognito:groups']?.includes('admin');

    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access Denied', message: 'Admin privileges required' }),
      };
    }

    // 2. Validate Input
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
    }

    const { targetUserId, fileId } = JSON.parse(event.body);
    if (!targetUserId || !fileId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing targetUserId or fileId' }) };
    }

    // 3. Mark as SAFE (Override)
    const tableName = process.env.FILE_TABLE;
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId: targetUserId, fileId },
        UpdateExpression: 'SET moderationStatus = :safe, adminOverridden = :true',
        ExpressionAttributeValues: {
          ':safe': 'SAFE',
          ':true': true,
        },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'File marked as safe' }),
    };

  } catch (error) {
    console.error('ADMIN_MARK_SAFE_ERROR:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
