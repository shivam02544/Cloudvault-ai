'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { adminGuard } = require('./shared/adminGuard');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

exports.handler = async (event) => {
  const guard = adminGuard(event);
  if (guard) return guard;

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { targetUserId, subject, message, type = 'info' } = body;
  if (!targetUserId || !subject || !message) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'targetUserId, subject, and message are required' }) };
  }

  try {
    // Store notification in DynamoDB
    const notificationId = randomUUID();
    await docClient.send(new PutCommand({
      TableName: process.env.FILE_TABLE,
      Item: {
        userId: targetUserId,
        fileId: `__NOTIF__${notificationId}`,
        notificationId,
        subject,
        message,
        type, // info | warning | success
        createdAt: new Date().toISOString(),
        read: false,
      },
    }));

    // Try to send email via SES (non-fatal if SES not configured)
    if (process.env.SES_FROM_EMAIL) {
      try {
        // Get user email from Cognito
        const cognitoUser = await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: targetUserId,
        }));
        const emailAttr = cognitoUser.UserAttributes?.find(a => a.Name === 'email');
        if (emailAttr?.Value) {
          await sesClient.send(new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [emailAttr.Value] },
            Message: {
              Subject: { Data: `CloudVault AI: ${subject}` },
              Body: { Text: { Data: message } },
            },
          }));
        }
      } catch (emailErr) {
        console.warn('Email send failed (non-fatal):', emailErr.message);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, notificationId }) };
  } catch (err) {
    console.error('ADMIN_NOTIFY_ERROR:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
