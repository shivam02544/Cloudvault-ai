'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const { adminGuard } = require('./shared/adminGuard');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

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
        console.warn('[AdminListUsers] Failed to decode nextToken:', e.message);
        exclusiveStartKey = undefined;
      }
    }

    // 4. Scan DynamoDB for STATS records
    const scanParams = {
      TableName: process.env.FILE_TABLE,
      FilterExpression: '#fid = :stats',
      ExpressionAttributeNames: { '#fid': 'fileId' },
      ExpressionAttributeValues: { ':stats': '__STATS__' },
      Limit: 50,
    };

    if (exclusiveStartKey) {
      scanParams.ExclusiveStartKey = exclusiveStartKey;
    }

    const res = await docClient.send(new ScanCommand(scanParams));
    const items = res.Items || [];

    // 5. Enrich each STATS record with Cognito email
    const users = await Promise.all(
      items.map(async (item) => {
        let email = null;

        try {
          const cognitoRes = await cognitoClient.send(
            new ListUsersCommand({
              UserPoolId: process.env.COGNITO_USER_POOL_ID,
              Filter: `sub = "${item.userId}"`,
            })
          );

          const userAttrs = cognitoRes.Users?.[0]?.Attributes || [];
          const emailAttr = userAttrs.find((a) => a.Name === 'email');
          email = emailAttr ? emailAttr.Value : null;
        } catch (cognitoErr) {
          console.warn(
            `[AdminListUsers] Cognito lookup failed for userId=${item.userId}:`,
            cognitoErr.message
          );
          // email stays null — do not fail the entire request
        }

        // 6. Build response user object with defaults
        return {
          userId: item.userId,
          email,
          totalBytesUsed: item.totalBytesUsed ?? 0,
          fileCount: item.fileCount ?? 0,
          status: item.status ?? 'active',
        };
      })
    );

    // 7. Encode LastEvaluatedKey as nextToken if present
    const nextToken = res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
      : null;

    // 8. Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ users, nextToken }),
    };
  } catch (err) {
    // 9. Catch-all — return 500 with no internal details
    console.error('[AdminListUsers] Unhandled error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
