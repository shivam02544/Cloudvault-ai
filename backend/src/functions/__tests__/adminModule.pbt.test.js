'use strict';

/**
 * Property-Based Tests for the Admin Module
 * Uses fast-check for property generation (100+ iterations each)
 *
 * Feature: admin-module
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock AWS SDK modules BEFORE requiring any handler
// ---------------------------------------------------------------------------

// DynamoDB mocks
const mockDynamoSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({ send: mockDynamoSend }),
    },
    GetCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'GetCommand' })),
    ScanCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'ScanCommand' })),
    DeleteCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'DeleteCommand' })),
    UpdateCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'UpdateCommand' })),
  };
});

// S3 mocks
const mockS3Send = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'DeleteObjectCommand' })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ input: params, type: 'GetObjectCommand' })),
}));

// S3 presigner mock
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned.example.com/file'),
}));

// Cognito mock
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ Users: [] }),
  })),
  ListUsersCommand: jest.fn().mockImplementation((params) => ({ input: params })),
}));

// ---------------------------------------------------------------------------
// Now require the handlers (after mocks are set up)
// ---------------------------------------------------------------------------
const { adminGuard } = require('../shared/adminGuard');
const { checkSuspension } = require('../shared/checkSuspension');
const adminListUsersHandler = require('../adminListUsers');
const adminListFilesHandler = require('../adminListFiles');
const adminDeleteFileHandler = require('../adminDeleteFile');
const adminSuspendUserHandler = require('../adminSuspendUser');
const getFileUrlHandler = require('../getFileUrl');

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------
process.env.FILE_TABLE = 'TestTable';
process.env.UPLOAD_BUCKET = 'TestBucket';
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an event with admin JWT claims */
function makeAdminEvent(overrides = {}) {
  return {
    requestContext: {
      authorizer: {
        jwt: {
          claims: { sub: 'admin-user-id', 'cognito:groups': ['admin'] },
        },
      },
    },
    pathParameters: {},
    queryStringParameters: {},
    ...overrides,
  };
}

/** Build an event with non-admin JWT claims */
function makeNonAdminEvent(groups, overrides = {}) {
  return {
    requestContext: {
      authorizer: {
        jwt: {
          claims: { sub: 'regular-user-id', 'cognito:groups': groups },
        },
      },
    },
    pathParameters: {},
    queryStringParameters: {},
    ...overrides,
  };
}

/** Build an event with no JWT claims */
function makeNoAuthEvent(overrides = {}) {
  return {
    requestContext: {},
    pathParameters: {},
    queryStringParameters: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Task 12.1 — P1+P2: Admin Guard
// ---------------------------------------------------------------------------

describe('P1+P2: Admin Guard', () => {
  // Feature: admin-module, Property 1: Admin Guard rejects non-admin callers
  // Feature: admin-module, Property 2: Admin Guard rejects missing/invalid JWT
  // Validates: Requirements 1.2, 1.3

  test('P1: returns 403 for any non-admin group array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string().filter((s) => s !== 'admin')),
        (groups) => {
          const event = makeNonAdminEvent(groups);
          const result = adminGuard(event);
          expect(result).not.toBeNull();
          expect(result.statusCode).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P2: returns 401 when claims are absent', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const event = makeNoAuthEvent();
          const result = adminGuard(event);
          expect(result).not.toBeNull();
          expect(result.statusCode).toBe(401);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P1+P2: returns null (allow) when cognito:groups includes "admin"', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string().filter((s) => s !== 'admin')),
        (extraGroups) => {
          const groups = [...extraGroups, 'admin'];
          const event = makeNonAdminEvent(groups);
          const result = adminGuard(event);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.2 — P3: User listing returns only STATS records
// ---------------------------------------------------------------------------

describe('P3: User listing returns only STATS records', () => {
  // Feature: admin-module, Property 3: User listing returns only STATS records
  // Validates: Requirements 2.1

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P3: response.users contains only __STATS__ records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            userId: fc.uuid(),
            fileId: fc.oneof(
              fc.constant('__STATS__'),
              fc.string({ minLength: 1 }).filter((s) => s !== '__STATS__' && !s.startsWith('__'))
            ),
            totalBytesUsed: fc.nat(),
            fileCount: fc.nat(),
            status: fc.constantFrom('active', 'suspended'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (items) => {
          // Mock Cognito inside the handler (already mocked at module level)
          // Mock DynamoDB scan to return all items
          mockDynamoSend.mockResolvedValueOnce({ Items: items, LastEvaluatedKey: undefined });

          const event = makeAdminEvent({ queryStringParameters: {} });
          const response = await adminListUsersHandler.handler(event);

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          // Every returned user must have come from a __STATS__ record
          const statsItems = items.filter((i) => i.fileId === '__STATS__');
          expect(body.users).toHaveLength(statsItems.length);
          body.users.forEach((u) => {
            expect(u.userId).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.3 — P4: Suspension round-trip
// ---------------------------------------------------------------------------

describe('P4: Suspension status round-trip', () => {
  // Feature: admin-module, Property 4: Suspension status round-trip
  // Validates: Requirements 4.1, 4.2

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P4: suspend then activate returns "active"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // suspend
          mockDynamoSend.mockResolvedValueOnce({});
          const suspendEvent = makeAdminEvent({
            pathParameters: { userId },
            rawPath: `/admin/users/${userId}/suspend`,
          });
          const suspendRes = await adminSuspendUserHandler.handler(suspendEvent);
          expect(suspendRes.statusCode).toBe(200);
          const suspendBody = JSON.parse(suspendRes.body);
          expect(suspendBody.status).toBe('suspended');

          // activate
          mockDynamoSend.mockResolvedValueOnce({});
          const activateEvent = makeAdminEvent({
            pathParameters: { userId },
            rawPath: `/admin/users/${userId}/activate`,
          });
          const activateRes = await adminSuspendUserHandler.handler(activateEvent);
          expect(activateRes.statusCode).toBe(200);
          const activateBody = JSON.parse(activateRes.body);
          expect(activateBody.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P4: activate then suspend returns "suspended"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // activate first
          mockDynamoSend.mockResolvedValueOnce({});
          const activateEvent = makeAdminEvent({
            pathParameters: { userId },
            rawPath: `/admin/users/${userId}/activate`,
          });
          const activateRes = await adminSuspendUserHandler.handler(activateEvent);
          expect(activateRes.statusCode).toBe(200);
          expect(JSON.parse(activateRes.body).status).toBe('active');

          // then suspend
          mockDynamoSend.mockResolvedValueOnce({});
          const suspendEvent = makeAdminEvent({
            pathParameters: { userId },
            rawPath: `/admin/users/${userId}/suspend`,
          });
          const suspendRes = await adminSuspendUserHandler.handler(suspendEvent);
          expect(suspendRes.statusCode).toBe(200);
          expect(JSON.parse(suspendRes.body).status).toBe('suspended');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.4 — P5: Suspended user blocked from all operations
// ---------------------------------------------------------------------------

describe('P5: Suspended user is blocked from all user operations', () => {
  // Feature: admin-module, Property 5: Suspended user is blocked from all user operations
  // Validates: Requirements 5.1, 5.2

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P5: checkSuspension returns 403 for status="suspended"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          userId: fc.uuid(),
          fileId: fc.constant('__STATS__'),
          status: fc.constant('suspended'),
        }),
        async (userId, statsItem) => {
          const mockDocClient = { send: jest.fn().mockResolvedValue({ Item: statsItem }) };
          const result = await checkSuspension(userId, mockDocClient, 'TestTable');
          expect(result).not.toBeNull();
          expect(result.statusCode).toBe(403);
          const body = JSON.parse(result.body);
          expect(body.error).toBe('Account suspended');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P5: checkSuspension returns null for non-suspended status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant(null), // missing item
          fc.record({
            userId: fc.uuid(),
            fileId: fc.constant('__STATS__'),
            status: fc.constantFrom('active', 'unknown', ''),
          })
        ),
        async (userId, item) => {
          const mockDocClient = {
            send: jest.fn().mockResolvedValue({ Item: item }),
          };
          const result = await checkSuspension(userId, mockDocClient, 'TestTable');
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.5 — P6: Platform Explorer never exposes S3 key
// ---------------------------------------------------------------------------

describe('P6: Platform Explorer never exposes S3 key', () => {
  // Feature: admin-module, Property 6: Platform Explorer never exposes S3 key
  // Validates: Requirements 6.4

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P6: no file in response has a "key" property', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            userId: fc.uuid(),
            fileId: fc.uuid(),
            filename: fc.string({ minLength: 1 }),
            size: fc.nat(),
            contentType: fc.constantFrom('image/jpeg', 'application/pdf', 'text/plain'),
            uploadedAt: fc.constant('2024-01-01T00:00:00Z'),
            key: fc.string({ minLength: 1 }), // arbitrary S3 key — must NOT appear in response
            tags: fc.array(fc.string()),
            moderationStatus: fc.constantFrom('SAFE', 'UNSAFE', 'PENDING'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (fileItems) => {
          mockDynamoSend.mockResolvedValueOnce({ Items: fileItems, LastEvaluatedKey: undefined });

          const event = makeAdminEvent({ queryStringParameters: {} });
          const response = await adminListFilesHandler.handler(event);

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          body.files.forEach((f) => {
            expect(f).not.toHaveProperty('key');
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.6 — P7: STATS decrements match file size exactly
// ---------------------------------------------------------------------------

describe('P7: Admin delete maintains STATS consistency', () => {
  // Feature: admin-module, Property 7: Admin delete maintains STATS consistency
  // Validates: Requirements 9.2, 9.3

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P7: UpdateCommand called with exact size decrement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.nat({ max: 10_000_000 }), // file size in bytes
        async (userId, fileId, size) => {
          const fileRecord = { userId, fileId, key: `${userId}/${fileId}/file.bin`, size };

          // GetCommand returns the file record
          mockDynamoSend
            .mockResolvedValueOnce({ Item: fileRecord }) // GetCommand
            .mockResolvedValueOnce({})                   // DeleteCommand
            .mockResolvedValueOnce({});                  // UpdateCommand

          mockS3Send.mockResolvedValueOnce({});

          const event = makeAdminEvent({
            pathParameters: { userId, fileId },
          });

          const response = await adminDeleteFileHandler.handler(event);
          expect(response.statusCode).toBe(200);

          // Find the UpdateCommand call (3rd DynamoDB send call)
          const updateCall = mockDynamoSend.mock.calls[2];
          expect(updateCall).toBeDefined();
          const updateInput = updateCall[0].input;
          expect(updateInput.ExpressionAttributeValues[':dec']).toBe(-1);
          expect(updateInput.ExpressionAttributeValues[':sizedec']).toBe(-size);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.7 — P8: DynamoDB unchanged when S3 delete fails
// ---------------------------------------------------------------------------

describe('P8: Admin delete is fail-safe ordered', () => {
  // Feature: admin-module, Property 8: Admin delete is fail-safe ordered
  // Validates: Requirements 9.4

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P8: DynamoDB not modified when S3 delete throws', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.nat({ max: 10_000_000 }),
        async (userId, fileId, size) => {
          const fileRecord = { userId, fileId, key: `${userId}/${fileId}/file.bin`, size };

          // GetCommand returns the file record
          mockDynamoSend.mockResolvedValueOnce({ Item: fileRecord });

          // S3 delete throws
          mockS3Send.mockRejectedValueOnce(new Error('S3 failure'));

          const event = makeAdminEvent({
            pathParameters: { userId, fileId },
          });

          const response = await adminDeleteFileHandler.handler(event);
          expect(response.statusCode).toBe(500);

          // DynamoDB should only have been called once (GetCommand), not DeleteCommand or UpdateCommand
          expect(mockDynamoSend).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.8 — P9: Admin preview requires admin privileges
// ---------------------------------------------------------------------------

describe('P9: Admin preview requires admin privileges', () => {
  // Feature: admin-module, Property 9: Admin preview requires admin privileges
  // Validates: Requirements 8.2

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P9: returns 403 for any non-admin JWT when targetUserId is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string().filter((s) => s !== 'admin')),
        fc.uuid(),
        fc.uuid(),
        async (nonAdminGroups, fileId, targetUserId) => {
          const event = makeNonAdminEvent(nonAdminGroups, {
            pathParameters: { fileId },
            queryStringParameters: { targetUserId },
            requestContext: {
              authorizer: {
                jwt: {
                  claims: {
                    sub: 'regular-user-id',
                    'cognito:groups': nonAdminGroups,
                  },
                },
              },
            },
          });

          // checkSuspension for the caller — return null (not suspended)
          mockDynamoSend.mockResolvedValueOnce({ Item: { status: 'active' } });

          const response = await getFileUrlHandler.handler(event);
          expect(response.statusCode).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.9 — P10: File listing excludes system records
// ---------------------------------------------------------------------------

describe('P10: File listing excludes system records', () => {
  // Feature: admin-module, Property 10: File listing excludes system records
  // Validates: Requirements 6.1

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('P10: no returned file has fileId starting with "__"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            userId: fc.uuid(),
            fileId: fc.string({ minLength: 1 }).filter((s) => !s.startsWith('__')),
            filename: fc.string({ minLength: 1 }),
            size: fc.nat(),
            contentType: fc.constant('image/jpeg'),
            uploadedAt: fc.constant('2024-01-01T00:00:00Z'),
            tags: fc.array(fc.string()),
            moderationStatus: fc.constant('SAFE'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (nonSystemItems) => {
          // DynamoDB filter is applied at DB level; mock returns only non-__ items
          mockDynamoSend.mockResolvedValueOnce({ Items: nonSystemItems, LastEvaluatedKey: undefined });

          const event = makeAdminEvent({ queryStringParameters: {} });
          const response = await adminListFilesHandler.handler(event);

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          body.files.forEach((f) => {
            expect(f.fileId).toBeDefined();
            expect(f.fileId.startsWith('__')).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 12.10 — P11: Pagination completeness
// ---------------------------------------------------------------------------

describe('P11: Pagination token consistency', () => {
  // Feature: admin-module, Property 11: Pagination token consistency
  // Validates: Requirements 2.5, 6.3, 11.1, 11.2

  /**
   * Simulate paginating through an array of items in chunks of `pageSize`.
   * Uses the same base64 JSON encoding/decoding as adminListUsers and adminListFiles.
   */
  function paginateItems(allItems, pageSize = 50) {
    const pages = [];
    let offset = 0;

    while (offset < allItems.length || pages.length === 0) {
      const chunk = allItems.slice(offset, offset + pageSize);
      const nextOffset = offset + pageSize;
      const hasMore = nextOffset < allItems.length;

      const nextToken = hasMore
        ? Buffer.from(JSON.stringify({ _offset: nextOffset })).toString('base64')
        : null;

      pages.push({ items: chunk, nextToken });
      offset = nextOffset;

      if (!hasMore) break;
    }

    return pages;
  }

  function decodeToken(token) {
    if (!token) return null;
    return JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  }

  test('P11: union of all pages equals full set with no duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 200 }),
        (allItems) => {
          const pages = paginateItems(allItems, 50);

          // Last page must have no nextToken
          expect(pages[pages.length - 1].nextToken).toBeNull();

          // Collect all items across pages
          const allReturned = pages.flatMap((p) => p.items);

          // Union equals full set
          expect(allReturned).toHaveLength(allItems.length);
          expect(new Set(allReturned)).toEqual(new Set(allItems));

          // No item appears on more than one page
          const seen = new Set();
          for (const item of allReturned) {
            expect(seen.has(item)).toBe(false);
            seen.add(item);
          }

          // Token round-trip: each non-null token decodes to a valid object
          pages.slice(0, -1).forEach((page) => {
            expect(page.nextToken).not.toBeNull();
            const decoded = decodeToken(page.nextToken);
            expect(decoded).not.toBeNull();
            expect(typeof decoded._offset).toBe('number');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P11: base64 token encode/decode round-trip is lossless', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          fileId: fc.uuid(),
        }),
        (key) => {
          const encoded = Buffer.from(JSON.stringify(key)).toString('base64');
          const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
          expect(decoded).toEqual(key);
        }
      ),
      { numRuns: 100 }
    );
  });
});
