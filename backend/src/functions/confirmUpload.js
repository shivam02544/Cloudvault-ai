const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const body = JSON.parse(event.body);
    const { fileId, key, filename, contentType, size } = body;

    // Validate required fields (DECISIONS.md Phase 3)
    if (!fileId || !key || !filename || !contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: fileId, key, filename, contentType',
        }),
      };
    }

    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    const tableName = process.env.FILE_TABLE;

    const item = {
      userId,
      fileId,
      key,
      filename,
      contentType,
      size: typeof size === 'number' ? size : 0,
      uploadedAt: new Date().toISOString(),
      status: 'active',
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, fileId }),
    };
  } catch (error) {
    console.error('confirmUpload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to confirm upload' }),
    };
  }
};
