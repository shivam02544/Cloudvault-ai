const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

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
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { fileId, isPublic } = JSON.parse(event.body);
    if (!fileId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'fileId is required' }) };
    }

    const sharingId = isPublic ? randomUUID().slice(0, 8) : null;
    const tableName = process.env.FILE_TABLE;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, fileId },
        UpdateExpression: 'SET isPublic = :p, sharingId = :s',
        ExpressionAttributeValues: {
          ':p': !!isPublic,
          ':s': sharingId,
        },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        isPublic: !!isPublic,
        sharingId
      }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ 
      event: 'TOGGLE_SHARING_ERROR', 
      error: error.message, 
      userId: userId || 'unknown' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to update sharing status' }),
    };
  }
};
