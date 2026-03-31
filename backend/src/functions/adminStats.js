const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // 1. RBAC Check (Cognito Groups)
    // Extract authorizer context (HttpApi v2 payload format uses jwt.claims)
    const authorizer = event.requestContext?.authorizer || {};
    const claims = authorizer.jwt?.claims || authorizer.claims || {};
    
    // DEBUG: Log ALL claims to CloudWatch for precision debugging
    // Direct check — the Cognito HTTP API JWT authorizer passes groups as 'groups' key
    const rawGroups = claims['cognito:groups'] || claims['groups'] || [];
    
    let groupList = [];
    if (Array.isArray(rawGroups)) {
      groupList = rawGroups;
    } else if (typeof rawGroups === 'string') {
      // Handle cases like '[admin]', '["admin"]', or "admin"
      groupList = rawGroups.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
    }
    const isAdmin = groupList.filter(Boolean).includes('admin');

    if (!isAdmin) {
      console.warn(`[AdminStats] Unauthorized access attempt. User: ${claims.email || claims.sub}. Claims: ${JSON.stringify(claims)}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access Denied', message: 'Admin privileges required' }),
      };
    }

    // 2. Fetch all __STATS__ records to aggregate global metrics
    const tableName = process.env.FILE_TABLE;
    
    const res = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: '#fid = :s',
        ExpressionAttributeNames: {
          '#fid': 'fileId',
        },
        ExpressionAttributeValues: {
          ':s': '__STATS__',
        },
      })
    );

    const statsRecords = res.Items || [];
    
    const totalStorageUsed = statsRecords.reduce((sum, item) => sum + (item.totalBytesUsed || 0), 0);
    const totalFileCount = statsRecords.reduce((sum, item) => sum + (item.fileCount || 0), 0);
    const activeUserCount = statsRecords.length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalStorageUsed,
        activeUserCount,
        totalFileCount,
        metadata: {
          generatedAt: new Date().toISOString(),
          units: 'bytes'
        }
      }),
    };
  } catch (error) {

    console.error('[AdminStats] CRITICAL_FAILURE:', {
      message: error.message,
      stack: error.stack,
      region: process.env.AWS_REGION,
      tableName: process.env.FILE_TABLE,
      event: JSON.stringify(event.requestContext?.authorizer)
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Failed to fetch admin statistics',
        detail: error.name // Surface error class for immediate diagnosis
      }),
    };
  }
};
