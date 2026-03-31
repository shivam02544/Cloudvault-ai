const { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { checkSuspension } = require('./shared/checkSuspension');

const rekClient = new RekognitionClient({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const tableName = process.env.FILE_TABLE;
  const bucketName = process.env.UPLOAD_BUCKET;

  // Detect invocation source
  const isApi = !!event.requestContext;
  let { fileId, userId, key, contentType, size } = event;

  if (isApi) {
    userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    fileId = event.pathParameters?.fileId;
  }

  console.log(`Analyzing: ${key || fileId} (Source: ${isApi ? 'API' : 'Internal'})`);

  try {
    if (!userId || !fileId) {
      return isApi 
        ? { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId or fileId' }) }
        : { success: false, error: 'Missing userId or fileId' };
    }

    if (isApi) {
      try {
        const suspensionError = await checkSuspension(userId, docClient, tableName);
        if (suspensionError) return suspensionError;
      } catch (suspErr) {
        console.warn('checkSuspension failed (non-fatal):', suspErr.message);
      }
    }

    // If metadata is missing (manual trigger), fetch it from DynamoDB
    if (!key || !contentType || !size) {
      const { Item } = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { userId, fileId }
        })
      );

      if (!Item) {
        return isApi
          ? { statusCode: 404, headers, body: JSON.stringify({ error: 'File not found' }) }
          : { success: false, error: 'File not found' };
      }
      
      key = Item.key;
      contentType = Item.contentType;
      size = Item.size;
    }

    // 1. File Type Validation (CRITICAL)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      console.log(`Skipping: Unsupported file type (${contentType})`);
      const reason = 'unsupported_type';
      return isApi 
        ? { statusCode: 400, headers, body: JSON.stringify({ success: false, reason }) }
        : { success: false, reason };
    }

    // 2. Size Constraint (Hybrid Rule)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (size > MAX_SIZE) {
      console.log(`Skipping: File too large (${size} bytes)`);
      const reason = 'file_too_large';
      return isApi 
        ? { statusCode: 400, headers, body: JSON.stringify({ success: false, reason }) }
        : { success: false, reason };
    }

    // 3. Idempotency Protection
    // (Already fetched Item from DDB above if isApi, but let's re-check consistently)
    const { Item: currentFile } = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, fileId }
      })
    );

    if (currentFile?.analyzed === true) {
      console.log("Skipping: Already analyzed");
      const reason = 'already_analyzed';
      return isApi 
        ? { statusCode: 200, headers, body: JSON.stringify({ success: true, reason }) }
        : { success: true, reason };
    }

    // 4. Call Rekognition (Parallel)
    let tags = [];
    let moderationLabels = [];
    let moderationStatus = 'SAFE';

    try {
      const [labelsRes, moderationRes] = await Promise.all([
        rekClient.send(new DetectLabelsCommand({
          Image: { S3Object: { Bucket: bucketName, Name: key } },
          MaxLabels: 20, // Fetch more to filter down
          MinConfidence: 75 // Rule 4: confidence >= 75%
        })),
        rekClient.send(new DetectModerationLabelsCommand({
          Image: { S3Object: { Bucket: bucketName, Name: key } },
          MinConfidence: 70 // Rule 5: moderation confidence >= 70%
        }))
      ]);

      // Process Tags (Rule 4: Top 10 only)
      tags = (labelsRes.Labels || [])
        .slice(0, 10)
        .map(label => label.Name);

      // Process Moderation (Rule 5: Store separately)
      moderationLabels = (moderationRes.ModerationLabels || []).map(label => ({
        name: label.Name,
        confidence: label.Confidence
      }));

      if (moderationLabels.length > 0) {
        moderationStatus = 'UNSAFE';
      }

      console.log("Tags:", tags);
      console.log("Moderation:", moderationLabels);

    } catch (rekErr) {
      // 6. Failure Handling (VERY IMPORTANT)
      console.error("Rekognition Error:", rekErr.message);
      // We do NOT throw. We simply finish with analyzed=false (default)
      return isApi 
        ? { statusCode: 500, headers, body: JSON.stringify({ success: false, error: rekErr.message }) }
        : { success: false, error: rekErr.message };
    }

    // 5. Update DynamoDB
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId, fileId },
        UpdateExpression: 'SET tags = :tags, moderationLabels = :mod, moderationStatus = :status, analyzed = :done',
        ExpressionAttributeValues: {
          ':tags': tags,
          ':mod': moderationLabels,
          ':status': moderationStatus,
          ':done': true
        }
      })
    );

    return isApi 
      ? { statusCode: 200, headers, body: JSON.stringify({ success: true, fileId, tags }) }
      : { success: true, fileId };

  } catch (error) {
    // Top-level failure handling
    console.error("Analyze function failed:", error.message);
    return isApi 
      ? { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
      : { success: false, error: error.message };
  }
};

