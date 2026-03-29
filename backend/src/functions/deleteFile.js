const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

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

    const userId = 'usr_test_123'; // Hardcoded for MVP
    const tableName = process.env.FILE_TABLE;

    // Soft delete: update status to 'deleted'
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          userId,
          fileId,
        },
        UpdateExpression: 'SET #status = :deleted',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':deleted': 'deleted',
        },
        ConditionExpression: 'attribute_exists(fileId)', // Ensure the file exists
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'File deleted successfully' }),
    };
  } catch (error) {
    console.error('deleteFile error:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete file' }),
    };
  }
};
