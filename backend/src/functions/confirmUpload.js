const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { checkSuspension } = require('./shared/checkSuspension');

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

    try {
      const suspensionError = await checkSuspension(userId, docClient, tableName);
      if (suspensionError) return suspensionError;
    } catch (suspErr) {
      console.warn('checkSuspension failed (non-fatal):', suspErr.message);
    }

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

    // Update user stats (Phase 7 Wave 2)
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { userId, fileId: '__STATS__' },
          UpdateExpression: 'ADD totalBytesUsed :size, fileCount :inc',
          ExpressionAttributeValues: {
            ':size': item.size,
            ':inc': 1,
          },
        })
      );
    } catch (statsErr) {
      console.warn(JSON.stringify({ 
        event: 'STATS_UPDATE_FAILED', 
        error: statsErr.message, 
        userId: userId || 'unknown' 
      }));
    }

    const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
    const lambda = new LambdaClient({ region: process.env.AWS_REGION });

    // ─── Phase 10: Async AI Analysis (Hybrid Strategy) ──────────────────────
    const MAX_AI_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (size <= MAX_AI_SIZE) {
      try {
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.ANALYZE_FUNCTION,
          InvocationType: 'Event', // Async
          Payload: JSON.stringify({
            fileId,
            userId,
            key,
            contentType,
            size
          })
        }));
        console.log(`AI analysis triggered for ${key}`);
      } catch (lambdaErr) {
        console.warn(`AI trigger failed for ${key}: ${lambdaErr.message}`);
      }
    } else {
      console.log(`AI analysis skipped for ${key} (size > 5MB)`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, fileId }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ 
      event: 'CONFIRM_UPLOAD_ERROR', 
      error: error.message, 
      userId: userId || 'unknown' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to confirm upload' }),
    };
  }
};
