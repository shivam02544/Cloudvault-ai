const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { sharingId } = event.pathParameters;
    if (!sharingId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sharingId is required' }) };
    }

    const tableName = process.env.FILE_TABLE;

    // Use GSI SharingIndex for O(1) lookup (Phase 8 Wave 1 Optimization)
    const res = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'SharingIndex',
        KeyConditionExpression: 'sharingId = :s',
        ExpressionAttributeValues: {
          ':s': sharingId,
        },
      })
    );

    if (!res.Items || res.Items.length === 0) {
      console.warn(`[PublicAccess] File not found or ID invalid: ${sharingId}`);
      return { 
        statusCode: 404, 
        headers, 
        body: JSON.stringify({ error: 'File not found' }) 
      };
    }

    const file = res.Items[0];
    
    // Safety check: Ensure isPublic is actually true (redundant security)
    if (!file.isPublic) {
      console.warn(`[PublicAccess] Unauthorized access attempt to private file: ${file.fileId}`);
      return { 
        statusCode: 403, 
        headers, 
        body: JSON.stringify({ error: 'This file is private' }) 
      };
    }

    const bucketName = process.env.UPLOAD_BUCKET;
    const key = file.key;

    if (!key) {
      console.error(`[PublicAccess] Missing S3 key for file: ${file.fileId}`);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'File storage reference missing' }) };
    }

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    // Public links have a slightly longer duration (e.g. 1 hour)
    const publicUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: publicUrl,
        filename: file.filename,
        size: file.size ? parseInt(file.size) : 0,
        contentType: file.contentType
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      event: 'GET_PUBLIC_URL_ERROR', 
      error: error.message, 
      sharingId: event.pathParameters?.sharingId || 'missing' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to fetch public file URL' }),
    };
  }
};
