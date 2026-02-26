/**
 * backend/graphql_server.js (fixed for CTF playability)
 *
 * Changes:
 *  - Accept both "field" and "f" as probe argument (player query compatibility)
 *  - The "internalKeyHint" field now returns the FULL key instead of only 8 chars
 *  - No other functionality changed
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret-token';
const SECRET_VALUE =
  process.env.SECRET_VALUE || 'SEASIDES{gr4phql_h1dd3n_s3cr3t}';

// ---- Crash Guards ----
process.on('unhandledRejection', (err) => {
  console.error('[!] Unhandled Promise Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('[!] Uncaught Exception:', err);
});

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '200kb' })); // slightly reduced limit

// --- lightweight nanoid replacement (CommonJS-safe)
function nanoid(size = 8) {
  const bytes = crypto.randomBytes(Math.ceil(size * 1.5));
  return bytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, size);
}

const DATA_PATH = path.join(__dirname, 'data', 'db.json');
let DB;
try {
  DB = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  DB = { items: [], internalBackups: [] };
}

DB.internalKey = DB.internalKey || `INTKEY-${nanoid(12)}`;

/* ---------- REST endpoints used by frontend ---------- */
app.get('/api/items', (req, res) => {
  return res.json(DB.items);
});

app.post('/api/items', (req, res) => {
  const name = req.body && req.body.name;
  if (!name) return res.status(400).json({ error: 'name required' });

  const it = { id: nanoid(8), name };
  DB.items.unshift(it);

  // persist to disk (non-blocking, crash-safe)
  fs.promises
    .writeFile(DATA_PATH, JSON.stringify(DB, null, 2))
    .catch((e) => console.error('failed to write DB:', e));

  res.status(201).json(it);
});

/* ---------- GraphQL-like custom executor (POST /graphql) ---------- */
function leakError(message, leakStr) {
  const e = new Error(`${message} (leak: ${leakStr})`);
  e.extensions = { leaked: leakStr };
  return e;
}

async function handleGraphQLLike({ query, variables, ctx }) {
  // --- Admin export handler ---
  if (typeof query === 'string' && query.includes('adminExport')) {
    try {
      const input = variables && variables.input;
      if (!input || typeof input !== 'object') throw new Error('invalid input');

      const token = input.auth && input.auth.token;
      const action = input.action;
      const payload = input.payload || {};
      const targetId = payload.targetId;
      const key = (payload.meta && payload.meta.key) || '';

      if (token !== ADMIN_TOKEN) throw new Error('forbidden');
      if (action !== 'EXPORT') throw new Error('bad action');

      const expectedPlain = `${DB.internalKey}:${targetId}:s3cr3tS`;
      const expectedBase64 = Buffer.from(expectedPlain).toString('base64');

      if (key !== expectedBase64 && key !== expectedPlain) {
        throw new Error('invalid key');
      }

      return {
        data: {
          adminExport: {
            ok: true,
            backup: {
              items: DB.items,
              internalBackups: DB.internalBackups,
              secret: SECRET_VALUE,
            },
          },
        },
      };
    } catch (err) {
      const e = new Error('adminExport failed');
      e.extensions = {
        reason: err.message,
        hint: 'internal-hint:__Typename__AdminOp',
      };
      return { errors: [{ message: e.message, extensions: e.extensions }] };
    }
  }

  // --- Probe-like leak handler ---
  if (typeof query === 'string' && query.includes('probe')) {
    // Accept both "field" and "f" for compatibility
    const field =
      (variables && (variables.field || variables.f)) || undefined;

    if (!field) {
      const err = leakError('probe requires field', '__Typename__ProbeError');
      return { errors: [{ message: err.message, extensions: err.extensions }] };
    }

    // ✅ Show full internal key for CTF playability
    if (field === 'internalKeyHint') {
      return { data: { probe: DB.internalKey } };
    }

    const hex = Buffer.from('s3cr3tS').toString('hex');
    const err = leakError('Field not found', `__LEAK__secretSuffix:${hex}`);
    return { errors: [{ message: err.message, extensions: err.extensions }] };
  }

  // --- Other simple queries ---
  if (typeof query === 'string' && query.includes('items')) {
    return { data: { items: DB.items } };
  }

  if (typeof query === 'string' && query.includes('hello')) {
    return { data: { hello: 'world' } };
  }

  const err = leakError('Unknown operation', '__Typename__UnknownOp');
  return { errors: [{ message: err.message, extensions: err.extensions }] };
}

/* ---------- Main /graphql route (wrapped with try/catch) ---------- */
app.post('/graphql', async (req, res) => {
  try {
    const body = req.body;
    const ctx = { ip: req.ip, headers: req.headers };

    if (Array.isArray(body)) {
      const results = [];
      for (const op of body) {
        const r = await handleGraphQLLike({
          query: op.query,
          variables: op.variables,
          ctx,
        });
        results.push(r);
      }
      return res.json(results);
    } else {
      const r = await handleGraphQLLike({
        query: body.query,
        variables: body.variables,
        ctx,
      });
      return res.json(r);
    }
  } catch (err) {
    console.error('GraphQL handler error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* ---------- Static frontend serving ---------- */
const PUBLIC_DIR = path.join(__dirname, 'public');

if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));

  app.get('*', (req, res) => {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return res.status(404).send('Not found');
  });
} else {
  app.get('/', (req, res) => {
    res.send(
      'Frontend not built. Build the frontend and copy the build into backend/public/'
    );
  });
}

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`Admin token (env): ${ADMIN_TOKEN}`);
  console.log(
    `Internal key hint (first 8 chars): ${DB.internalKey.slice(0, 8)}`
  );
  console.log(
    `Available internal backup id: ${
      DB.internalBackups[0] && DB.internalBackups[0].id
    }`
  );
});
