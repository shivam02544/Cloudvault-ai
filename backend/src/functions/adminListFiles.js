'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const { adminGuard } = require('./shared/adminGuard');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  // 1. Admin guard — return early if not admin
  const guardResponse = adminGuard(event);
  if (guardResponse !== null) {
    return guardResponse;
  }

  try {
    // 2. Read optional nextToken from query string
    const rawToken = event.queryStringParameters?.nextToken;

    // 3. Decode nextToken to ExclusiveStartKey if present
    let exclusiveStartKey;
    if (rawToken) {
      try {
        const decoded = Buffer.from(rawToken, 'base64').toString('utf8');
        exclusiveStartKey = JSON.parse(decoded);
      } catch (e) {
        console.warn('[AdminListFiles] Failed to decode nextToken:', e.message);
        exclusiveStartKey = undefined;
      }
    }

    // 4. Scan DynamoDB — exclude internal records (fileId starts with "__")
    const scanParams = {
      TableName: process.env.FILE_TABLE,
      FilterExpression: 'NOT begins_with(#fid, :prefix)',
      ExpressionAttributeNames: { '#fid': 'fileId' },
      ExpressionAttributeValues: { ':prefix': '__' },
      Limit: 50,
    };

    if (exclusiveStartKey) {
      scanParams.ExclusiveStartKey = exclusiveStartKey;
    }

    const res = await docClient.send(new ScanCommand(scanParams));

    // 5 & 6. Map items: strip `key`, add `isNsfw`, return only allowed fields
    const files = (res.Items || []).map((item) => ({
      userId: item.userId,
      fileId: item.fileId,
      filename: item.filename,
      size: item.size,
      contentType: item.contentType,
      uploadedAt: item.uploadedAt,
      tags: item.tags,
      moderationStatus: item.moderationStatus,
      isNsfw: item.moderationStatus === 'UNSAFE',
    }));

    // 8. Encode LastEvaluatedKey as nextToken if present
    const nextToken = res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
      : null;

    // 9. Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files, nextToken }),
    };
  } catch (err) {
    // 10. Catch-all — return 500 with no internal details
    console.error('[AdminListFiles] Unhandled error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
