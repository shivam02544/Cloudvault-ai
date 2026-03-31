const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { checkSuspension } = require('./shared/checkSuspension');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const tableName = process.env.FILE_TABLE;

    // checkSuspension is non-fatal — if it throws, proceed normally
    try {
      const suspensionError = await checkSuspension(userId, docClient, tableName);
      if (suspensionError) return suspensionError;
    } catch (suspErr) {
      console.warn('checkSuspension failed (non-fatal):', suspErr.message);
    }

    const res = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, fileId: '__STATS__' },
      })
    );

    const stats = res.Item || { totalBytesUsed: 0, fileCount: 0 };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        storageUsed: stats.totalBytesUsed || 0,
        fileCount: stats.fileCount || 0,
        maxStorage: 5 * 1024 * 1024 * 1024, // 5GB hardcoded limit for Milestone v1.2
      }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ 
      event: 'USER_STATS_ERROR', 
      error: error.message, 
      userId: userId || 'unknown' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to fetch user statistics' }),
    };
  }
};
