const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { checkSuspension } = require('./shared/checkSuspension');
const { adminGuard } = require('./shared/adminGuard');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const fileId = event.pathParameters?.fileId;

    if (!fileId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing fileId parameter' }),
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
    const bucketName = process.env.UPLOAD_BUCKET;

    const suspensionError = await checkSuspension(userId, docClient, tableName);
    if (suspensionError) return suspensionError;

    // Admin preview: allow admin to fetch URL for another user's file
    const targetUserId = event.queryStringParameters?.targetUserId;
    let lookupUserId = userId;

    if (targetUserId) {
      const guardResponse = adminGuard(event);
      if (guardResponse !== null) return guardResponse;
      lookupUserId = targetUserId;
    }

    // Fetch the S3 key from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId: lookupUserId, fileId },
      })
    );

    const item = result.Item;

    // Return 404 if file not found or if softly deleted
    if (!item || item.status === 'deleted') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    const key = item.key;

    // Generate a secure Pre-Signed READ URL with 10 min expiration
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: url }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ 
      event: 'GET_FILE_URL_ERROR', 
      error: error.message, 
      userId: userId || 'unknown' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to generate download URL' }),
    };
  }
};
