const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');

// The SDK automatically pulls region from AWS_REGION environment variable
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    // Basic validation
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    const { filename, contentType, size } = JSON.parse(event.body);

    if (!filename || !contentType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'filename and contentType are required' }) };
    }

    const fileId = randomUUID();
    // For MVP, we are hardcoding a test user ID. In a real app, this comes from an authorizer (e.g., JWT).
    const userId = 'usr_test_123';
    
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
      },
      body: JSON.stringify({
        uploadUrl,
        fileId,
        key
      }),
    };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate upload URL' })
    };
  }
};
