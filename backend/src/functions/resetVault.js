'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const tableName = process.env.FILE_TABLE;
    const bucketName = process.env.UPLOAD_BUCKET;

    // 1. Fetch all items for the user
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );

    const items = queryResult.Items || [];
    const filesToDelete = items.filter(item => !item.fileId.startsWith('__'));
    
    if (filesToDelete.length === 0) {
      // Nothing to delete, but we should still ensure stats are reset
      await resetStats(userId, tableName);
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, message: 'Vault was already empty. Stats reset.' }) 
      };
    }

    // 2. Delete from S3 in batches (Max 1000 per request)
    const s3Keys = filesToDelete.map(f => ({ Key: f.key })).filter(k => k.Key);
    if (s3Keys.length > 0) {
      for (let i = 0; i < s3Keys.length; i += 1000) {
        const batch = s3Keys.slice(i, i + 1000);
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: batch },
          })
        );
      }
    }

    // 3. Delete from DynamoDB in batches (Max 25 per request)
    for (let i = 0; i < filesToDelete.length; i += 25) {
      const batch = filesToDelete.slice(i, i + 25);
      const deleteRequests = batch.map(f => ({
        DeleteRequest: {
          Key: { userId: f.userId, fileId: f.fileId }
        }
      }));

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: deleteRequests
          }
        })
      );
    }

    // 4. Reset stats
    await resetStats(userId, tableName);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        message: `Vault reset successfully. ${filesToDelete.length} files deleted.` 
      }) 
    };

  } catch (error) {
    console.error('RESET_VAULT_ERROR:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to reset vault' }) 
    };
  }
};

async function resetStats(userId, tableName) {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        fileId: '__STATS__',
        fileCount: 0,
        totalBytesUsed: 0,
        maxStorage: 5 * 1024 * 1024 * 1024, // 5GB default
        updatedAt: new Date().toISOString()
      }
    })
  );
}
