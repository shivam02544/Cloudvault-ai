'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { adminGuard } = require('./shared/adminGuard');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  // 1. Admin guard
  const guardResponse = adminGuard(event);
  if (guardResponse !== null) return guardResponse;

  // 2. Extract userId and fileId from path parameters
  const { userId, fileId } = event.pathParameters || {};

  try {
    // 3. Fetch file record from DynamoDB
    const res = await docClient.send(
      new GetCommand({
        TableName: process.env.FILE_TABLE,
        Key: { userId, fileId },
      })
    );

    // 4. Return 404 if record doesn't exist
    if (!res.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // 5. Extract key and size from the fetched record
    const fileRecord = res.Item;
    const { key, size } = fileRecord;

    // 6. Delete S3 object — return 500 if it fails, do NOT proceed to DynamoDB
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.UPLOAD_BUCKET,
          Key: key,
        })
      );
    } catch (s3Err) {
      console.error('ADMIN_DELETE_FILE_S3_ERROR:', s3Err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }

    // 7. Delete DynamoDB File_Record
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.FILE_TABLE,
        Key: { userId, fileId },
      })
    );

    // 8. Update STATS_Record to decrement counts (non-fatal if missing)
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.FILE_TABLE,
          Key: { userId, fileId: '__STATS__' },
          UpdateExpression: 'ADD fileCount :dec, totalBytesUsed :sizedec',
          ExpressionAttributeValues: { ':dec': -1, ':sizedec': -(size || 0) },
          ConditionExpression: 'attribute_exists(fileId)',
        })
      );
    } catch (statsErr) {
      if (statsErr.name !== 'ConditionalCheckFailedException') {
        console.warn('ADMIN_STATS_DECREMENT_FAILED:', statsErr.message);
      }
    }

    // 9. Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, fileId }),
    };
  } catch (err) {
    // 10. Outer catch
    console.error('ADMIN_DELETE_FILE_ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
