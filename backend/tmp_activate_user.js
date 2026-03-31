const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function run() {
  try {
    await docClient.send(new UpdateCommand({
      TableName: 'CloudVaultFiles',
      Key: { userId: 'f1838d7a-b0d1-7041-8379-d577a6be9cc7', fileId: '__STATS__' },
      UpdateExpression: 'SET #s = :a',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':a': 'active' }
    }));
    console.log('User f1838d7a-b0d1-7041-8379-d577a6be9cc7 activated successfully.');
  } catch (err) {
    console.error('FAILED TO ACTIVATE USER:', err);
    process.exit(1);
  }
}

run();
