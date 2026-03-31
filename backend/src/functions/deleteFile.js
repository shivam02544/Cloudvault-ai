'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { checkSuspension } = require('./shared/checkSuspension');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  try {
    const fileId = event.pathParameters?.fileId;
    if (!fileId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fileId parameter' }) };
    }

    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const tableName = process.env.FILE_TABLE;

    const suspensionError = await checkSuspension(userId, docClient, tableName);
    if (suspensionError) return suspensionError;

    // Fetch the file record to get the S3 key and size
    const res = await docClient.send(
      new GetCommand({ TableName: tableName, Key: { userId, fileId } })
    );

    if (!res.Item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'File not found' }) };
    }

    const { key, size } = res.Item;

    // Hard delete: remove from S3 first
    if (key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: process.env.UPLOAD_BUCKET, Key: key })
        );
      } catch (s3Err) {
        console.error(JSON.stringify({ event: 'DELETE_FILE_S3_ERROR', error: s3Err.message, userId }));
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to delete file from storage' }) };
      }
    }

    // Remove DynamoDB record
    await docClient.send(
      new DeleteCommand({ TableName: tableName, Key: { userId, fileId } })
    );

    // Decrement user stats (only if STATS record exists)
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { userId, fileId: '__STATS__' },
          UpdateExpression: 'ADD fileCount :dec, totalBytesUsed :sizedec',
          ExpressionAttributeValues: { ':dec': -1, ':sizedec': -(size || 0) },
          ConditionExpression: 'attribute_exists(fileId)',
        })
      );
    } catch (statsErr) {
      if (statsErr.name !== 'ConditionalCheckFailedException') {
        console.warn('STATS_DECREMENT_FAILED:', statsErr.message);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'File deleted successfully' }) };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ event: 'DELETE_FILE_ERROR', error: error.message, userId: userId || 'unknown' }));
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to delete file' }) };
  }
};
