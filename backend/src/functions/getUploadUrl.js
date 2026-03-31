const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { checkSuspension } = require('./shared/checkSuspension');

// The SDK automatically pulls region from AWS_REGION environment variable
const s3 = new S3Client({ region: process.env.AWS_REGION });
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

const MAX_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

exports.handler = async (event) => {
  try {
    // Basic validation
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    let filename, contentType, size;
    try {
      ({ filename, contentType, size } = JSON.parse(event.body));
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!filename || !contentType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'filename and contentType are required' }) };
    }

    const fileId = randomUUID();
    const headers = { 'Content-Type': 'application/json' };
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Quota Enforcement (Phase 7 Wave 2)
    const tableName = process.env.FILE_TABLE;

    try {
      const suspensionError = await checkSuspension(userId, docClient, tableName);
      if (suspensionError) return suspensionError;
    } catch (suspErr) {
      console.warn('checkSuspension failed (non-fatal):', suspErr.message);
    }
    const statsRes = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, fileId: '__STATS__' },
      })
    );

    const currentUsage = statsRes.Item?.totalBytesUsed || 0;
    if (currentUsage + (size || 0) > MAX_QUOTA_BYTES) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Storage quota exceeded', 
          message: `Uploading this file would exceed your 5GB limit. Current usage: ${Math.round(currentUsage / (1024 * 1024))}MB`
        }),
      };
    }
    
    // Construct the S3 key
    // Using a clear pattern: userId/fileId-filename
    const bucketName = process.env.UPLOAD_BUCKET;
    const key = `${userId}/${fileId}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType, // Required for presigned URL when client sends the file
    });

    // Generate Pre-signed URL valid for 300 seconds (5 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadUrl,
        fileId,
        key
      }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({
      event: 'UPLOAD_URL_ERROR',
      error: error.message,
      userId: userId || 'unknown'
    }));
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to generate upload URL' })
    };
  }
};
