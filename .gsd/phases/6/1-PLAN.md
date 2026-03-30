---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: AWS Cognito Setup in SAM Template

## Objective
Provision AWS Cognito User Pool and User Pool Client via SAM, then attach a native JWT Authorizer to the existing `CloudVaultApi` HttpApi to protect all backend endpoints. This is the foundation that all subsequent plans depend on.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- .gsd/phases/6/RESEARCH.md
- backend/template.yaml

## Tasks

<task type="auto">
  <name>Add Cognito User Pool and User Pool Client to template.yaml</name>
  <files>backend/template.yaml</files>
  <action>
    Insert the following two resources into the `Resources:` section of `backend/template.yaml`, BEFORE the `CloudVaultApi` resource:

    ```yaml
    # Cognito User Pool
    CloudVaultUserPool:
      Type: AWS::Cognito::UserPool
      Properties:
        UserPoolName: CloudVaultUserPool
        AutoVerifiedAttributes:
          - email
        Policies:
          PasswordPolicy:
            MinimumLength: 8
            RequireUppercase: true
            RequireLowercase: true
            RequireNumbers: true
            RequireSymbols: false

    # Cognito User Pool Client (no secret — required for browser JS)
    CloudVaultUserPoolClient:
      Type: AWS::Cognito::UserPoolClient
      Properties:
        UserPoolId: !Ref CloudVaultUserPool
        ClientName: CloudVaultWebClient
        GenerateSecret: false
        ExplicitAuthFlows:
          - ALLOW_USER_PASSWORD_AUTH
          - ALLOW_REFRESH_TOKEN_AUTH
        PreventUserExistenceErrors: ENABLED
    ```

    `GenerateSecret: false` is mandatory for JS browser clients — a client secret cannot be kept secure in a browser environment.
    `ALLOW_USER_PASSWORD_AUTH` enables the SRP-free direct auth flow required by `amazon-cognito-identity-js`.
  </action>
  <verify>powershell -Command "Select-String -Path backend/template.yaml -Pattern 'CloudVaultUserPool'"</verify>
  <done>The `CloudVaultUserPool` and `CloudVaultUserPoolClient` resources are found in `template.yaml`.</done>
</task>

<task type="auto">
  <name>Add JWT Authorizer to CloudVaultApi and protect all Lambda routes</name>
  <files>backend/template.yaml</files>
  <action>
    Modify the existing `CloudVaultApi` resource to add a `Auth` block with a Cognito JWT Authorizer. The existing `CorsConfiguration` must be preserved. Add `Authorization` to `AllowHeaders` if not already present (it already is). The updated `CloudVaultApi` should look like:

    ```yaml
    CloudVaultApi:
      Type: AWS::Serverless::HttpApi
      Properties:
        Auth:
          DefaultAuthorizer: CognitoAuthorizer
          Authorizers:
            CognitoAuthorizer:
              IdentitySource: "$request.header.Authorization"
              JwtConfiguration:
                issuer: !Sub "https://cognito-idp.${AWS::Region}.amazonaws.com/${CloudVaultUserPool}"
                audience:
                  - !Ref CloudVaultUserPoolClient
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
    ```

    The `DefaultAuthorizer: CognitoAuthorizer` automatically protects ALL routes attached to this API with no per-route configuration needed.
  </action>
  <verify>powershell -Command "Select-String -Path backend/template.yaml -Pattern 'CognitoAuthorizer'"</verify>
  <done>`CognitoAuthorizer` is defined under the `CloudVaultApi` `Auth` block in `template.yaml`.</done>
</task>

<task type="auto">
  <name>Add Cognito Outputs to template.yaml</name>
  <files>backend/template.yaml</files>
  <action>
    Add the following outputs to the `Outputs:` section of `template.yaml` so the Cognito IDs are accessible after deployment:

    ```yaml
    UserPoolId:
      Description: "Cognito User Pool ID"
      Value: !Ref CloudVaultUserPool

    UserPoolClientId:
      Description: "Cognito User Pool Client ID"
      Value: !Ref CloudVaultUserPoolClient
    ```

    These values will be needed to configure the frontend `.env` file after `sam deploy`.
  </action>
  <verify>powershell -Command "Select-String -Path backend/template.yaml -Pattern 'UserPoolId'"</verify>
  <done>`UserPoolId` and `UserPoolClientId` appear in the `Outputs` section of `template.yaml`.</done>
</task>

## Success Criteria
- [ ] `CloudVaultUserPool` and `CloudVaultUserPoolClient` resources exist in `template.yaml`.
- [ ] `CloudVaultApi` has a `DefaultAuthorizer: CognitoAuthorizer` JWT Auth block.
- [ ] `UserPoolId` and `UserPoolClientId` are exported as SAM Outputs.
