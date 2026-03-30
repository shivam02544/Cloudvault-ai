---
phase: 6
plan: 2
wave: 2
---

# Plan 6.2: Backend Lambda userId Extraction from JWT

## Objective
Replace the hardcoded `const userId = 'usr_test_123'` in all 5 Lambda functions with the authenticated user's identity extracted from the Cognito JWT claims. This ensures every user only accesses their own data.

## Context
- .gsd/phases/6/RESEARCH.md
- backend/src/functions/getUploadUrl.js
- backend/src/functions/confirmUpload.js
- backend/src/functions/listFiles.js
- backend/src/functions/deleteFile.js
- backend/src/functions/getFileUrl.js

## Tasks

<task type="auto">
  <name>Replace hardcoded userId in getUploadUrl.js and confirmUpload.js</name>
  <files>
    backend/src/functions/getUploadUrl.js
    backend/src/functions/confirmUpload.js
  </files>
  <action>
    In BOTH files, replace the hardcoded line:
    ```js
    const userId = 'usr_test_123'; // Hardcoded for MVP
    ```
    with:
    ```js
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    ```

    For `getUploadUrl.js`, note that it does not already define a `headers` object. Add one at the top of the try block:
    ```js
    const headers = { 'Content-Type': 'application/json' };
    ```
    Then use this `userId` in the S3 key construction and metadata write.

    The path `event.requestContext.authorizer.jwt.claims.sub` is exactly where API Gateway HTTP API injects the JWT sub claim after a Cognito JWT Authorizer validates the token. Do NOT use `event.requestContext.identity` — that is for REST APIs, not HTTP APIs.
  </action>
  <verify>powershell -Command "Select-String -Path backend/src/functions/getUploadUrl.js,backend/src/functions/confirmUpload.js -Pattern 'authorizer'"</verify>
  <done>Both files extract userId from JWT claims and return 401 if missing.</done>
</task>

<task type="auto">
  <name>Replace hardcoded userId in listFiles.js, deleteFile.js, and getFileUrl.js</name>
  <files>
    backend/src/functions/listFiles.js
    backend/src/functions/deleteFile.js
    backend/src/functions/getFileUrl.js
  </files>
  <action>
    In ALL THREE files, replace the hardcoded line:
    ```js
    const userId = 'usr_test_123'; // Hardcoded for MVP
    ```
    with:
    ```js
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    ```

    Each of these files already defines a `headers` object at the top of the handler — the 401 early return can reuse it.

    For `getFileUrl.js`, first view it to confirm its structure before editing. Preserve all existing S3 and DynamoDB logic — only replace the userId line.
  </action>
  <verify>powershell -Command "Select-String -Path backend/src/functions/listFiles.js,backend/src/functions/deleteFile.js,backend/src/functions/getFileUrl.js -Pattern 'authorizer'"</verify>
  <done>All three files extract userId from JWT claims with a 401 guard.</done>
</task>

## Success Criteria
- [ ] All 5 Lambda functions extract `userId` from `event.requestContext.authorizer.jwt.claims.sub`.
- [ ] All 5 functions return HTTP 401 if `userId` is missing/undefined.
- [ ] No instances of `'usr_test_123'` remain in any backend function.
