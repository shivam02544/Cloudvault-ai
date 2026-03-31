'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { adminGuard } = require('./shared/adminGuard');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const guard = adminGuard(event);
  if (guard) return guard;

  const { userId } = event.pathParameters || {};
  const action = event.rawPath?.split('/').pop(); // 'approve' or 'deny'

  if (!userId || !['approve', 'deny'].includes(action)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  let denyReason = '';
  if (action === 'deny' && event.body) {
    try { ({ reason: denyReason = '' } = JSON.parse(event.body)); } catch {}
  }

  const newStatus = action === 'approve' ? 'active' : 'denied';
  const tableName = process.env.FILE_TABLE;

  try {
    // Update status
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { userId, fileId: '__STATS__' },
      UpdateExpression: 'SET #s = :status, approvedAt = :ts' + (denyReason ? ', denyReason = :reason' : ''),
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':ts': new Date().toISOString(),
        ...(denyReason ? { ':reason': denyReason } : {}),
      },
      ConditionExpression: 'attribute_exists(fileId)',
    }));

    // Send email notification if SES is configured
    if (process.env.SES_FROM_EMAIL && process.env.COGNITO_USER_POOL_ID) {
      try {
        const cognitoUser = await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: userId,
        }));
        const emailAttr = cognitoUser.UserAttributes?.find(a => a.Name === 'email');
        if (emailAttr?.Value) {
          const subject = action === 'approve'
            ? 'Your CloudVault AI account has been approved!'
            : 'Update on your CloudVault AI account';
          const body = action === 'approve'
            ? `Hi,\n\nGreat news! Your CloudVault AI account has been approved by our team.\n\nYou can now log in and start using your vault at ${process.env.APP_URL || 'https://cloudvault.ai'}.\n\nWelcome aboard!\n\nThe CloudVault AI Team`
            : `Hi,\n\nWe've reviewed your CloudVault AI account registration and unfortunately we're unable to approve it at this time.\n\n${denyReason ? `Reason: ${denyReason}\n\n` : ''}If you believe this is a mistake, please contact our support team.\n\nThe CloudVault AI Team`;

          await sesClient.send(new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [emailAttr.Value] },
            Message: {
              Subject: { Data: subject },
              Body: { Text: { Data: body } },
            },
          }));
        }
      } catch (emailErr) {
        console.warn('Email notification failed (non-fatal):', emailErr.message);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, userId, status: newStatus }) };
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }
    console.error('ADMIN_APPROVE_USER_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
