const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
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
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const tableName = process.env.FILE_TABLE;

    try {
      const suspensionError = await checkSuspension(userId, docClient, tableName);
      if (suspensionError) return suspensionError;
    } catch (suspErr) {
      console.warn('checkSuspension failed (non-fatal):', suspErr.message);
    }

    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) };
    }
    let fileId, isPublic;
    try {
      ({ fileId, isPublic } = JSON.parse(event.body));
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
    if (!fileId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'fileId is required' }) };
    }

    const sharingId = isPublic ? randomUUID().slice(0, 8) : null;

    // Use specific expressions to avoid "null key" GSI validation errors
    // and correctly handle reserved words if they ever overlap (SAFE-SET)
    const updateParams = {
      TableName: tableName,
      Key: { userId, fileId },
      UpdateExpression: isPublic 
        ? 'SET isPublic = :p, sharingId = :s' 
        : 'SET isPublic = :p REMOVE sharingId',
      ExpressionAttributeValues: {
        ':p': !!isPublic,
      },
    };

    if (isPublic) {
      updateParams.ExpressionAttributeValues[':s'] = sharingId;
    }

    await docClient.send(new UpdateCommand(updateParams));

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
    console.error('TOGGLE_SHARING_ERROR:', {
      message: error.message,
      stack: error.stack,
      userId: userId || 'unknown'
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message }),
    };
  }
};

