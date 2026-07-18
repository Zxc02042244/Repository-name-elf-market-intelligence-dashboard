import { randomBytes, randomUUID } from 'node:crypto';

const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;

const safeFatalVersion = (name) => {
  const value = process.env[name]?.trim() ?? '';
  return VERSION_PATTERN.test(value) ? value : 'UNAVAILABLE';
};
const safeFatal = () => {
  console.log('Harness | HTTP 0 | code=HARNESS_FAILURE | FAIL');
  console.log('Total | passed=0 | failed=1');
  console.log(
    `Versions | CLI ${safeFatalVersion('STRICT_E2E_CLI_VERSION')} | PostgREST ${safeFatalVersion('STRICT_E2E_POSTGREST_VERSION')}`,
  );
  process.exitCode = 1;
};
process.once('uncaughtException', safeFatal);
process.once('unhandledRejection', safeFatal);

const CUSTOM_REJECTION = 'ELF_VISITOR_CREDENTIAL_REJECTED';
const SAFE_MESSAGE = 'The visitor credential was not accepted.';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const SAFE_CODES = new Set([
  'OK',
  '22023',
  '22P02',
  '42501',
  'PGRST102',
  CUSTOM_REJECTION,
  'HARNESS_FAILURE',
  'LOG_MODEL_REJECTED',
]);

const requiredEnvironment = (name) => {
  const value = process.env[name];
  if (!value) throw new Error('missing environment');
  return value;
};

const baseUrl = new URL(requiredEnvironment('STRICT_E2E_URL'));
const anonKey = requiredEnvironment('STRICT_E2E_ANON_KEY');
const serviceRoleKey = requiredEnvironment('STRICT_E2E_SERVICE_ROLE_KEY');
const cliVersion = requiredEnvironment('STRICT_E2E_CLI_VERSION').trim();
const postgrestVersion = requiredEnvironment('STRICT_E2E_POSTGREST_VERSION').trim();

const assertLocalUrl = (url) => {
  if (
    url.protocol !== 'http:'
    || !LOCAL_HOSTS.has(url.hostname)
    || url.username
    || url.password
  ) {
    throw new Error('non-local endpoint');
  }
};

assertLocalUrl(baseUrl);
for (const [name, value] of Object.entries(process.env)) {
  if (/SUPABASE|STRICT_E2E/i.test(name) && /(?:supabase\.co|supabase\.com)/i.test(value ?? '')) {
    throw new Error('production hostname');
  }
}

if (cliVersion !== '2.109.1' || !VERSION_PATTERN.test(postgrestVersion)) {
  throw new Error('unexpected version');
}

const visitorId = randomUUID();
const visitorToken = randomUUID();
const wrongToken = randomUUID();
const nullHashVisitorId = randomUUID();
const nullHashToken = randomUUID();
const unknownVisitorId = randomUUID();
const unknownVisitorToken = randomUUID();
const validationVisitorId = randomUUID();
const validationToken = randomUUID();
const authenticatedVisitorId = randomUUID();
const authenticatedToken = randomUUID();
const syntheticEmail = `strict-token-${randomUUID()}@example.invalid`;
const syntheticPassword = `E2E-${randomBytes(32).toString('base64url')}`;
const firstSkinId = 'toy-sheriff';
const secondSkinId = 'arale';
const thirdSkinId = 'pink-bunny';
const fourthSkinId = 'cidi-echo';

const sensitiveValues = [
  anonKey,
  serviceRoleKey,
  visitorId,
  visitorToken,
  wrongToken,
  nullHashVisitorId,
  nullHashToken,
  unknownVisitorId,
  unknownVisitorToken,
  validationVisitorId,
  validationToken,
  authenticatedVisitorId,
  authenticatedToken,
  syntheticEmail,
  syntheticPassword,
  firstSkinId,
  secondSkinId,
  thirdSkinId,
  fourthSkinId,
];

const request = async (path, options = {}) => {
  const url = new URL(path, baseUrl);
  assertLocalUrl(url);
  if (url.origin !== baseUrl.origin) throw new Error('endpoint origin changed');

  const response = await fetch(url, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  let body = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }
  return { status: response.status, body, raw };
};

const authHeaders = (apiKey, bearer = apiKey) => ({
  apikey: apiKey,
  authorization: `Bearer ${bearer}`,
  'content-type': 'application/json',
});

const rpc = (name, payload, bearer = anonKey, rawBody = null) => request(
  `/rest/v1/rpc/${name}`,
  {
    method: 'POST',
    headers: authHeaders(anonKey, bearer),
    body: rawBody ?? JSON.stringify(payload),
  },
);

const responseCode = (result) => (
  typeof result.body?.code === 'string' ? result.body.code : 'OK'
);

const exactCustomRejection = (result) => {
  const body = result.body;
  if (
    result.status !== 409
    || body === null
    || body.code !== CUSTOM_REJECTION
    || body.message !== SAFE_MESSAGE
    || body.details !== null
    || body.hint !== null
    || Object.keys(body).sort().join(',') !== 'code,details,hint,message'
  ) {
    return false;
  }

  if (sensitiveValues.some((value) => value && result.raw.includes(value))) return false;
  return !(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(result.raw)
    || /\b[0-9a-f]{64}\b/i.test(result.raw)
    || /\b(?:select|insert|update|delete|raise|sqlstate|relation|column|constraint)\b/i.test(result.raw)
  );
};

const leaders = (result) => (
  Array.isArray(result.body?.wishlistLeaders) ? result.body.wishlistLeaders : []
);

const logEntries = [];
let passed = 0;
let failed = 0;

const record = (name, result, ok) => {
  const status = Number.isInteger(result?.status) ? result.status : 0;
  const observedCode = responseCode(result ?? {});
  const code = SAFE_CODES.has(observedCode) ? observedCode : 'HARNESS_FAILURE';
  logEntries.push(`${name} | HTTP ${status} | code=${code} | ${ok ? 'PASS' : 'FAIL'}`);
  if (ok) passed += 1;
  else failed += 1;
};

const runCase = async (name, expectedStatus, expectedCode, operation, validate = () => true) => {
  let result;
  try {
    result = await operation();
    const code = responseCode(result);
    const ok = result.status === expectedStatus
      && code === expectedCode
      && expectedCode !== CUSTOM_REJECTION
      && validate(result);
    record(name, result, ok);
  } catch {
    record(name, result, false);
  }
};

const runCustomRejectionCase = async (name, operation) => {
  let result;
  try {
    result = await operation();
    record(name, result, exactCustomRejection(result));
  } catch {
    record(name, result, false);
  }
};

const setupAuthenticatedUser = async () => {
  const createResult = await request('/auth/v1/admin/users', {
    method: 'POST',
    headers: authHeaders(serviceRoleKey),
    body: JSON.stringify({
      email: syntheticEmail,
      password: syntheticPassword,
      email_confirm: true,
    }),
  });
  if (createResult.status !== 200) throw new Error('auth setup failed');

  const signInResult = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: authHeaders(anonKey),
    body: JSON.stringify({ email: syntheticEmail, password: syntheticPassword }),
  });
  if (signInResult.status !== 200 || typeof signInResult.body?.access_token !== 'string') {
    throw new Error('auth sign-in failed');
  }
  sensitiveValues.push(signInResult.body.access_token);
  return signInResult.body.access_token;
};

const seedNullHashVisitor = async () => {
  const result = await request('/rest/v1/rpc/strict_token_http_e2e_seed_null_hash', {
    method: 'POST',
    headers: authHeaders(serviceRoleKey),
    body: JSON.stringify({ p_visitor_id: nullHashVisitorId }),
  });
  if (result.status !== 204 && result.status !== 200) throw new Error('fixture setup failed');
};

let harnessFailed = false;
try {
  const authenticatedAccessToken = await setupAuthenticatedUser();
  await seedNullHashVisitor();

  let initialSyncResult;
  let currentVisitorCount;
  await runCase(
    'Normal new visitor sync',
    200,
    'OK',
    async () => {
      initialSyncResult = await rpc('sync_skin_gallery_state', {
        p_visitor_id: visitorId,
        p_visitor_token: visitorToken,
        p_skin_ids: [firstSkinId, firstSkinId],
      });
      return initialSyncResult;
    },
    (result) => Number.isInteger(result.body?.visitorCount),
  );
  record(
    'Normal duplicate normalization',
    initialSyncResult,
    initialSyncResult?.status === 200
      && leaders(initialSyncResult).some(
        (entry) => entry.skinId === firstSkinId && entry.wishCount === 1,
      ),
  );

  await runCase(
    'Normal correct credential update',
    200,
    'OK',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: visitorId,
      p_visitor_token: visitorToken,
      p_skin_ids: [secondSkinId],
    }),
    (result) => {
      currentVisitorCount = result.body?.visitorCount;
      return Number.isInteger(currentVisitorCount)
        && leaders(result).some(
          (entry) => entry.skinId === secondSkinId && entry.wishCount === 1,
        )
        && !leaders(result).some((entry) => entry.skinId === firstSkinId);
    },
  );

  await runCustomRejectionCase(
    'Rejection hashed visitor sync',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: visitorId,
      p_visitor_token: wrongToken,
      p_skin_ids: [secondSkinId],
    }),
  );
  await runCustomRejectionCase(
    'Rejection null-hash visitor sync',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: nullHashVisitorId,
      p_visitor_token: nullHashToken,
      p_skin_ids: [firstSkinId],
    }),
  );
  await runCustomRejectionCase(
    'Rejection hashed visitor delete',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: visitorId,
      p_visitor_token: wrongToken,
    }),
  );
  await runCustomRejectionCase(
    'Rejection null-hash visitor delete',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: nullHashVisitorId,
      p_visitor_token: nullHashToken,
    }),
  );

  await runCase(
    'Delete unknown visitor no-op',
    200,
    'OK',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: unknownVisitorId,
      p_visitor_token: unknownVisitorToken,
    }),
    (result) => result.body?.visitorCount === currentVisitorCount,
  );
  await runCase(
    'Delete valid credential',
    200,
    'OK',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: visitorId,
      p_visitor_token: visitorToken,
    }),
    (result) => result.body?.visitorCount === currentVisitorCount - 1,
  );

  await runCase(
    'ACL authenticated sync',
    403,
    '42501',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: authenticatedVisitorId,
      p_visitor_token: authenticatedToken,
      p_skin_ids: [firstSkinId],
    }, authenticatedAccessToken),
    (result) => result.status !== 409 && responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'ACL authenticated delete',
    403,
    '42501',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: authenticatedVisitorId,
      p_visitor_token: authenticatedToken,
    }, authenticatedAccessToken),
    (result) => result.status !== 409 && responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'ACL anon browser RPC',
    200,
    'OK',
    () => rpc('get_skin_gallery_stats', {}),
  );

  await runCase(
    'Validation malformed UUID',
    400,
    '22P02',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: 'not-a-uuid',
      p_visitor_token: validationToken,
      p_skin_ids: [],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation null sync credential',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: null,
      p_visitor_token: validationToken,
      p_skin_ids: [],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation null delete credential',
    400,
    '22023',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: null,
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation matching sync credentials',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationVisitorId,
      p_skin_ids: [],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation matching delete credentials',
    400,
    '22023',
    () => rpc('delete_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationVisitorId,
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation more than three items',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationToken,
      p_skin_ids: [firstSkinId, secondSkinId, thirdSkinId, fourthSkinId],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation blank item',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationToken,
      p_skin_ids: ['  '],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation invalid item',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationToken,
      p_skin_ids: ['synthetic-invalid-item'],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation oversized item',
    400,
    '22023',
    () => rpc('sync_skin_gallery_state', {
      p_visitor_id: validationVisitorId,
      p_visitor_token: validationToken,
      p_skin_ids: ['x'.repeat(65)],
    }),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
  await runCase(
    'Validation malformed JSON',
    400,
    'PGRST102',
    () => rpc('sync_skin_gallery_state', null, anonKey, '{"p_visitor_id":'),
    (result) => responseCode(result) !== CUSTOM_REJECTION,
  );
} catch {
  harnessFailed = true;
  record('Harness setup', null, false);
}

const versionEntry = `Versions | CLI ${cliVersion} | PostgREST ${postgrestVersion}`;
const totalEntry = `Total | passed=${passed} | failed=${failed}`;
const completeLogModel = [...logEntries, totalEntry, versionEntry].join('\n');
const logModelLeaks = sensitiveValues.some(
  (value) => value && completeLogModel.includes(value),
) || /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(completeLogModel)
  || /\b[0-9a-f]{64}\b/i.test(completeLogModel)
  || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(completeLogModel);

if (logModelLeaks) {
  console.log('Log model | HTTP 0 | code=LOG_MODEL_REJECTED | FAIL');
  console.log('Total | passed=0 | failed=1');
  console.log(`Versions | CLI ${cliVersion} | PostgREST ${postgrestVersion}`);
  process.exitCode = 1;
} else {
  for (const entry of logEntries) console.log(entry);
  console.log(totalEntry);
  console.log(versionEntry);
  if (harnessFailed || failed > 0) process.exitCode = 1;
}
