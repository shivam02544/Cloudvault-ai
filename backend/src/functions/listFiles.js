const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { checkSuspension } = require('./shared/checkSuspension');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    const tableName = process.env.FILE_TABLE;

    try {
      const suspensionError = await checkSuspension(userId, docClient, tableName);
      if (suspensionError) return suspensionError;
    } catch (suspErr) {
      console.warn('checkSuspension failed (non-fatal):', suspErr.message);
    }

    // Query by userId (HASH key) — NOT a Scan (DECISIONS.md Phase 3)
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
        },
        // Return newest files first (requires a GSI for full correctness,
        // but for MVP with PAY_PER_REQUEST this gives us the right sort order
        // when DynamoDB returns in range key order — uploadedAt ordering
        // is handled client-side via sort after fetch)
        ScanIndexForward: false,
      })
    );

    const { q } = event.queryStringParameters || {};
    const searchTerm = q?.toLowerCase().trim();

    // Return metadata + S3 key only — pre-signed read URLs generated lazily on demand
    // (DECISIONS.md Phase 3: do NOT generate URLs eagerly for all files)
    const files = (result.Items || [])
      .filter((item) => item.status !== 'deleted')
      .filter((item) => {
        if (!searchTerm) return true;
        
        const filename = (item.filename || "").toLowerCase();
        const tags = (item.tags || []).map(t => t.toLowerCase());
        
        // Match filename OR tags (Partial Match supported)
        const nameMatch = filename.includes(searchTerm);
        const tagMatch = tags.some(tag => tag.includes(searchTerm));
        
        return nameMatch || tagMatch;
      })
      .map((item) => ({
        fileId: item.fileId,
        filename: item.filename,
        contentType: item.contentType,
        size: item.size,
        uploadedAt: item.uploadedAt,
        status: item.status,
        key: item.key,
        tags: item.tags || [],
        analyzed: item.analyzed || false,
        moderationStatus: item.moderationStatus || 'SAFE',
        isPublic: item.isPublic || false,
        sharingId: item.sharingId || null,
      }));



    // Sort by uploadedAt descending (newest first) — client-side for MVP
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files }),
    };
  } catch (error) {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    console.error(JSON.stringify({ 
      event: 'LIST_FILES_ERROR', 
      error: error.message, 
      userId: userId || 'unknown' 
    }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: 'Failed to list files' }),
    };
  }
};
