---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Backend — confirmUpload & listFiles Lambdas + template.yaml

## Objective
Add two new Lambda functions to the SAM backend: `confirmUpload` (writes metadata to DynamoDB) and `listFiles` (queries DynamoDB and returns file list). Wire both into `template.yaml` under `CloudVaultApi`. This is the complete backend for Phase 3 — no frontend changes here.

## Context
- `backend/template.yaml` — existing SAM infrastructure (has `GetUploadUrlFunction`, `CloudVaultApi`, `FileMetadataTable`, `StorageBucket`)
- `backend/src/functions/getUploadUrl.js` — reference for handler pattern (CommonJS, `exports.handler`)
- `backend/src/package.json` — has `uuid` as only dependency; `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` must be added
- `.gsd/DECISIONS.md` — Phase 3: `POST /files/confirm` writes 8 fields, `GET /files` returns metadata + key only (no eager pre-signed URLs), DynamoDB Query by userId, proper HTTP codes

## Tasks

<task type="auto">
  <name>Add @aws-sdk/client-dynamodb and @aws-sdk/lib-dynamodb to backend dependencies</name>
  <files>backend/src/package.json</files>
  <action>
    Replace the contents of `backend/src/package.json` with:
    ```json
    {
      "name": "cloudvault-ai-backend",
      "version": "1.0.0",
      "description": "Backend API for CloudVault AI MVP",
      "main": "index.js",
      "dependencies": {
        "uuid": "^9.0.1",
        "@aws-sdk/client-dynamodb": "^3.0.0",
        "@aws-sdk/lib-dynamodb": "^3.0.0",
        "@aws-sdk/client-s3": "^3.0.0",
        "@aws-sdk/s3-request-presigner": "^3.0.0"
      }
    }
    ```
    Note: In the Lambda execution environment, AWS SDK v3 clients are available as part of the Node.js 20 runtime, but declaring them explicitly ensures local development works correctly.
  </action>
  <verify>File `backend/src/package.json` contains `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`.</verify>
  <done>package.json updated with all 5 dependencies listed.</done>
</task>

<task type="auto">
  <name>Create confirmUpload Lambda — POST /files/confirm</name>
  <files>backend/src/functions/confirmUpload.js</files>
  <action>
    Create `backend/src/functions/confirmUpload.js`:

    ```javascript
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    exports.handler = async (event) => {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      };

      try {
        if (!event.body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing request body' }),
          };
        }

        const body = JSON.parse(event.body);
        const { fileId, key, filename, contentType, size } = body;

        // Validate required fields (DECISIONS.md Phase 3)
        if (!fileId || !key || !filename || !contentType) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required fields: fileId, key, filename, contentType',
            }),
          };
        }

        const userId = 'usr_test_123'; // Hardcoded for MVP
        const tableName = process.env.FILE_TABLE;

        const item = {
          userId,
          fileId,
          key,
          filename,
          contentType,
          size: size || 0,
          uploadedAt: new Date().toISOString(),
          status: 'active',
        };

        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: item,
          })
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, fileId }),
        };
      } catch (error) {
        console.error('confirmUpload error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to confirm upload' }),
        };
      }
    };
    ```
  </action>
  <verify>File `backend/src/functions/confirmUpload.js` exists and exports a `handler` function.</verify>
  <done>
    - Required fields validated: fileId, key, filename, contentType
    - All 8 metadata fields written to DynamoDB
    - 400 on missing body or fields, 500 on DynamoDB error, 200 on success
  </done>
</task>

<task type="auto">
  <name>Create listFiles Lambda — GET /files</name>
  <files>backend/src/functions/listFiles.js</files>
  <action>
    Create `backend/src/functions/listFiles.js`:

    ```javascript
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    exports.handler = async (event) => {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      };

      try {
        const userId = 'usr_test_123'; // Hardcoded for MVP
        const tableName = process.env.FILE_TABLE;

        // Query by userId (HASH key) — NOT a Scan (DECISIONS.md Phase 3)
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: {
              ':uid': userId,
            },
            // Return newest files first
            ScanIndexForward: false,
          })
        );

        // Return metadata + S3 key only — pre-signed read URLs generated lazily on demand
        const files = (result.Items || []).map((item) => ({
          fileId: item.fileId,
          filename: item.filename,
          contentType: item.contentType,
          size: item.size,
          uploadedAt: item.uploadedAt,
          status: item.status,
          key: item.key,
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ files }),
        };
      } catch (error) {
        console.error('listFiles error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to list files' }),
        };
      }
    };
    ```
  </action>
  <verify>File `backend/src/functions/listFiles.js` exists, uses QueryCommand (not ScanCommand), and maps items to a flat array without pre-signed URLs.</verify>
  <done>
    - DynamoDB Query by userId (not Scan)
    - Returns array of `{ fileId, filename, contentType, size, uploadedAt, status, key }`
    - No pre-signed URLs in the response (lazy strategy from DECISIONS.md)
    - 500 on error, 200 on success
  </done>
</task>

<task type="auto">
  <name>Extend template.yaml — add ConfirmUploadFunction and ListFilesFunction</name>
  <files>backend/template.yaml</files>
  <action>
    Replace the full content of `backend/template.yaml` with the expanded version that adds the two new Lambda resources before the `Outputs` block:

    ```yaml
    AWSTemplateFormatVersion: '2010-09-09'
    Transform: AWS::Serverless-2016-10-31
    Description: CloudVault AI Backend Infrastructure

    Globals:
      Function:
        Timeout: 10
        MemorySize: 256
        Runtime: nodejs20.x
        Architectures:
          - x86_64
        Environment:
          Variables:
            UPLOAD_BUCKET: !Ref StorageBucket
            FILE_TABLE: !Ref FileMetadataTable

    Resources:
      # HTTP API with CORS
      CloudVaultApi:
        Type: AWS::Serverless::HttpApi
        Properties:
          CorsConfiguration:
            AllowOrigins:
              - "*"
            AllowMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            AllowHeaders:
              - Content-Type
              - Authorization

      # Storage Bucket
      StorageBucket:
        Type: AWS::S3::Bucket
        Properties:
          BucketName: !Sub "cloudvault-ai-storage-${AWS::AccountId}-${AWS::Region}"
          CorsConfiguration:
            CorsRules:
              - AllowedHeaders:
                  - "*"
                AllowedMethods:
                  - PUT
                  - GET
                  - POST
                AllowedOrigins:
                  - "*"
                ExposedHeaders:
                  - ETag
                MaxAge: 3000

      # DynamoDB Table
      FileMetadataTable:
        Type: AWS::DynamoDB::Table
        Properties:
          TableName: "CloudVaultFiles"
          AttributeDefinitions:
            - AttributeName: "userId"
              AttributeType: "S"
            - AttributeName: "fileId"
              AttributeType: "S"
          KeySchema:
            - AttributeName: "userId"
              KeyType: "HASH"
            - AttributeName: "fileId"
              KeyType: "RANGE"
          BillingMode: PAY_PER_REQUEST

      # Lambda: Get Upload URL (Phase 1)
      GetUploadUrlFunction:
        Type: AWS::Serverless::Function
        Properties:
          CodeUri: src/
          Handler: functions/getUploadUrl.handler
          Policies:
            - S3WritePolicy:
                BucketName: !Ref StorageBucket
          Events:
            ApiEvent:
              Type: HttpApi
              Properties:
                ApiId: !Ref CloudVaultApi
                Path: /files/upload-url
                Method: POST

      # Lambda: Confirm Upload — write metadata to DynamoDB (Phase 3)
      ConfirmUploadFunction:
        Type: AWS::Serverless::Function
        Properties:
          CodeUri: src/
          Handler: functions/confirmUpload.handler
          Policies:
            - DynamoDBWritePolicy:
                TableName: !Ref FileMetadataTable
          Events:
            ApiEvent:
              Type: HttpApi
              Properties:
                ApiId: !Ref CloudVaultApi
                Path: /files/confirm
                Method: POST

      # Lambda: List Files — query DynamoDB by userId (Phase 3)
      ListFilesFunction:
        Type: AWS::Serverless::Function
        Properties:
          CodeUri: src/
          Handler: functions/listFiles.handler
          Policies:
            - DynamoDBReadPolicy:
                TableName: !Ref FileMetadataTable
          Events:
            ApiEvent:
              Type: HttpApi
              Properties:
                ApiId: !Ref CloudVaultApi
                Path: /files
                Method: GET

    Outputs:
      ApiEndpoint:
        Description: "API Gateway endpoint URL"
        Value: !Sub "https://${CloudVaultApi}.execute-api.${AWS::Region}.amazonaws.com/"
    ```
  </action>
  <verify>
    `backend/template.yaml` contains:
    - `ConfirmUploadFunction` with `DynamoDBWritePolicy` wired to `POST /files/confirm`
    - `ListFilesFunction` with `DynamoDBReadPolicy` wired to `GET /files`
    - Both under `CloudVaultApi`
  </verify>
  <done>
    - 3 Lambda functions in template (GetUploadUrl, ConfirmUpload, ListFiles)
    - ConfirmUpload has DynamoDBWritePolicy
    - ListFiles has DynamoDBReadPolicy
    - All 3 share the same CloudVaultApi (CORS consistent)
  </done>
</task>

## Success Criteria
- [ ] `backend/src/functions/confirmUpload.js` exists with validation + DynamoDB PutCommand
- [ ] `backend/src/functions/listFiles.js` exists with QueryCommand (not ScanCommand)
- [ ] `backend/template.yaml` has `ConfirmUploadFunction` and `ListFilesFunction` resources
- [ ] Both new endpoints registered under the same `CloudVaultApi`
- [ ] All handlers use try/catch with 200/400/500 responses
