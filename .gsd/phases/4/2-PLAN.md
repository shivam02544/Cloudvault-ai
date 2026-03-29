---
phase: 4
plan: 2
wave: 1
---

# Plan 4.2: Backend — Update listFiles & template.yaml

## Objective
Filter the listFiles output to omit soft-deleted files and bind the new Lambdas into the serverless deployment template securely.

## Context
- `backend/src/functions/listFiles.js` (existing)
- `backend/template.yaml` (existing)

## Tasks

<task type="auto">
  <name>Update listFiles to filter soft-deleted files</name>
  <files>backend/src/functions/listFiles.js</files>
  <action>
    Modify `listFiles.js`.
    - Ensure the mapper filters out files where `status === 'deleted'`.
    - Currently, it simply maps `result.Items`. Add a `.filter(item => item.status !== 'deleted')` before doing the map.
  </action>
  <verify>Check `backend/src/functions/listFiles.js` filtering mechanism.</verify>
  <done>`status === 'deleted'` files are omitted downstream entirely.</done>
</task>

<task type="auto">
  <name>Extend SAM template.yaml with new functions</name>
  <files>backend/template.yaml</files>
  <action>
    Inject the two new functions (`DeleteFileFunction` and `GetFileUrlFunction`) under the `Resources` block.
    - `DeleteFileFunction`:
      - `Path: /files/{fileId}`, `Method: DELETE`
      - `Policies`: `DynamoDBWritePolicy`
    - `GetFileUrlFunction`:
      - `Path: /files/{fileId}/url`, `Method: GET`
      - `Policies`: Need BOTH `DynamoDBReadPolicy` (to fetch key from DB) and `S3ReadPolicy` (to permit URL generation against bucket).
    - Ensure both bind securely to `ApiId: !Ref CloudVaultApi`.
  </action>
  <verify>File `backend/template.yaml` reflects `DeleteFileFunction` and `GetFileUrlFunction` directly prior to `Outputs`.</verify>
  <done>All routing and policy restrictions accurately deployed mapping Phase 4 endpoints.</done>
</task>

## Success Criteria
- [ ] Soft deletion correctly mirrors as "missing" in normal UI queries.
- [ ] `template.yaml` seamlessly maps HTTP API methods to discrete secure policies.
