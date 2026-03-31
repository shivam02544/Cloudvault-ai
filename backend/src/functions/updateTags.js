const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
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
    const { fileId } = event.pathParameters || {};
    
    if (!userId || !fileId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized or Missing fileId' }),
      };
    }

    const tableName = process.env.FILE_TABLE;

    const suspensionError = await checkSuspension(userId, docClient, tableName);
    if (suspensionError) return suspensionError;

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let tags;
    try {
      ({ tags } = JSON.parse(event.body));
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!Array.isArray(tags) || tags.length > 50 || tags.some(t => typeof t !== 'string' || t.length > 100)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tags must be an array of strings (max 50 tags, 100 chars each)' }),
      };
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, fileId },
        UpdateExpression: 'SET tags = :tags',
        ExpressionAttributeValues: {
          ':tags': tags,
        },
        // Ensure user owns the file before updating
        ConditionExpression: 'attribute_exists(userId)',
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, tags }),
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      event: 'UPDATE_TAGS_ERROR', 
      error: error.message 
    }));
    
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found or access denied' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
