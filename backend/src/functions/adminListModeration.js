const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // 1. RBAC Check
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
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access Denied' }) };
    }

    // 2. Fetch all UNSAFE files
    const tableName = process.env.FILE_TABLE;
    const res = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: '#ms = :u',
        ExpressionAttributeNames: {
          '#ms': 'moderationStatus',
        },
        ExpressionAttributeValues: {
          ':u': 'UNSAFE',
        },
      })
    );

    const riskyFiles = (res.Items || []).map(item => ({
      userId: item.userId,
      fileId: item.fileId,
      filename: item.filename,
      contentType: item.contentType,
      size: item.size,
      uploadedAt: item.uploadedAt,
      moderationLabels: item.moderationLabels || [],
      moderationStatus: item.moderationStatus,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files: riskyFiles }),
    };

  } catch (error) {
    console.error('ADMIN_LIST_MODERATION_ERROR:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
