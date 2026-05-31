const https = require('https');
const { getStore, pushLog, recentLogs } = require('./_shared');

function hitCounter() {
  return new Promise((resolve, reject) => {
    const request = https.get('https://api.countapi.xyz/hit/sit-visitor-counter/homepage', (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('Counter service returned non-2xx status'));
          return;
        }

        try {
          const data = JSON.parse(body);
          const visits = Number(data.value);

          if (!Number.isFinite(visits)) {
            reject(new Error('Counter service returned invalid payload'));
            return;
          }

          resolve(visits);
        } catch {
          reject(new Error('Counter service returned invalid JSON'));
        }
      });
    });

    request.on('error', () => {
      reject(new Error('Counter service request failed'));
    });

    request.setTimeout(3500, () => {
      request.destroy(new Error('Counter service timed out'));
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    pushLog('warn', 'method_not_allowed', { method: req.method });
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const store = getStore();
  store.totalHits += 1;

  const requestStart = Date.now();
  let includeDebug = false;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    includeDebug = url.searchParams.get('debug') === '1';
  } catch {
    includeDebug = false;
  }

  pushLog('info', 'visit_request_started', {
    method: req.method,
    path: req.url || '/'
  });

  try {
    const visits = await hitCounter();
    store.lastVisits = visits;
    store.lastError = null;

    pushLog('info', 'visit_request_success', {
      visits,
      durationMs: Date.now() - requestStart
    });

    const payload = {
      visits,
      degraded: false,
      timestamp: new Date().toISOString()
    };

    if (includeDebug) {
      payload.logs = recentLogs(40);
    }

    res.status(200).json(payload);
  } catch {
    const fallbackVisits = (Number(store.lastVisits) || 0) + 1;
    store.lastVisits = fallbackVisits;
    store.lastError = 'Counter service unavailable';

    pushLog('error', 'visit_request_fallback', {
      fallbackVisits,
      durationMs: Date.now() - requestStart
    });

    const payload = {
      visits: fallbackVisits,
      degraded: true,
      error: 'Counter service unavailable; using fallback counter',
      timestamp: new Date().toISOString()
    };

    if (includeDebug) {
      payload.logs = recentLogs(40);
    }

    // Return 200 so the site never shows a hard failure when the upstream is down.
    res.status(200).json(payload);
  }
};