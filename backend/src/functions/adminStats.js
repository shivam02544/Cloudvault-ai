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
    console.log('[AdminStats] Full Claims Object:', JSON.stringify(claims));

    // Flexible group detection
    const groupList = [];
    
    // Check all common keys for group/role lists
    ['cognito:groups', 'groups', 'custom:groups', 'roles'].forEach(key => {
      const val = claims[key];
      if (Array.isArray(val)) groupList.push(...val);
      else if (typeof val === 'string') groupList.push(val);
    });

    const isAdmin = groupList.includes('admin') || claims['cognito:groups']?.includes('admin');

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
    
    console.log('[AdminStats] Scanning for global statistics...');
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
    console.log(`[AdminStats] Found ${statsRecords.length} user stats records.`);
    
    const totalStorageUsed = statsRecords.reduce((sum, item) => sum + (item.totalBytesUsed || 0), 0);
    const activeUserCount = statsRecords.length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalStorageUsed,
        activeUserCount,
        metadata: {
          generatedAt: new Date().toISOString(),
          units: 'bytes'
        }
      }),
    };
  } catch (error) {
    console.error(JSON.stringify({ 
      event: 'ADMIN_STATS_ERROR', 
      error: error.message 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to fetch admin statistics' }),
    };
  }
};
