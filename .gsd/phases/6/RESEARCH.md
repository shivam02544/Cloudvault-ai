# Phase 6 Research — Authentication & User System

## Discovery Level: 2 (Standard Research — new external integration)

## Current Codebase State

### Backend
- 5 Lambda functions: `getUploadUrl`, `confirmUpload`, `listFiles`, `deleteFile`, `getFileUrl`
- All functions have `const userId = 'usr_test_123';` hardcoded — must be replaced
- `HttpApi` defined in SAM with CORS but **no Authorizers yet**
- DynamoDB table `CloudVaultFiles` already uses `userId` (HASH) + `fileId` (RANGE) — correct schema, no migration needed

### Frontend
- React 19 + Vite + TailwindCSS v4
- No router installed — single-page with one `App.jsx`
- API URL from `import.meta.env.VITE_API_URL`
- `axios` already installed
- No auth context, no auth pages

---

## AWS Cognito + SAM HttpApi JWT Authorizer Pattern

### SAM Template Changes Required
```yaml
# 1. Add User Pool
CloudVaultUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: CloudVaultUserPool
    AutoVerifiedAttributes: [email]
    Policies:
      PasswordPolicy:
        MinimumLength: 8

# 2. Add User Pool Client
CloudVaultUserPoolClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    UserPoolId: !Ref CloudVaultUserPool
    ClientName: CloudVaultWebClient
    ExplicitAuthFlows:
      - ALLOW_USER_PASSWORD_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH
    GenerateSecret: false  # Required for JS frontend clients

# 3. Add JWT Authorizer to existing HttpApi
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
    CorsConfiguration: ...  # Keep existing CORS
```

### JWT userId Extraction in Lambdas
With a JWT Authorizer on HTTP API:
```js
// Available without any extra code — API Gateway injects this
const userId = event.requestContext.authorizer.jwt.claims.sub;
```
The `sub` claim is Cognito's stable unique user ID — correct PK to use.

---

## Frontend Auth Library

### Decision: `amazon-cognito-identity-js`
- Lightweight, no Amplify overhead
- Native Cognito User Pool flows: Signup, Login (InitiateAuth), Logout
- Returns JWT `idToken` after authentication
- Install: `npm install amazon-cognito-identity-js`

### Auth Flow (Frontend)
1. User signs up → Cognito sends verification email
2. User logs in → `AuthenticationDetails` → `authenticateUser` → get `CognitoUserSession`
3. Store `idToken.getJwtToken()` in `localStorage`
4. Attach as `Authorization: Bearer <token>` header on all API calls

### Routing
- Install `react-router-dom` for route protection
- Routes: `/login`, `/signup`, `/` (dashboard — protected)
- `ProtectedRoute` component checks localStorage token and redirects to `/login`

---

## Environment Variables Needed

Frontend `.env.example` additions:
```
VITE_API_URL=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=
```

---

## Execution Wave Plan

| Plan | Wave | Scope |
|------|------|-------|
| 6.1  | 1    | SAM: Add Cognito UserPool + Client + JWT Authorizer to HttpApi |
| 6.2  | 2    | Backend: Replace hardcoded userId in all 5 Lambdas |
| 6.3  | 2    | Frontend: Install deps, AuthContext, API helper with Authorization header |
| 6.4  | 3    | Frontend: Login + Signup pages (amazon-cognito-identity-js) |
| 6.5  | 3    | Frontend: react-router-dom routing, ProtectedRoute, Navbar logout |
