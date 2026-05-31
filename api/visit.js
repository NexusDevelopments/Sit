function getStore() {
  if (!globalThis.__sitDebugStore) {
    globalThis.__sitDebugStore = {
      startedAt: new Date().toISOString(),
      totalHits: 0,
      lastVisits: 0,
      lastError: null,
      logs: [],
      nextId: 1
    };
  }

  return globalThis.__sitDebugStore;
}

function pushLog(level, event, meta) {
  const store = getStore();
  store.logs.push({
    id: store.nextId++,
    time: new Date().toISOString(),
    level,
    event,
    meta: meta || {}
  });

  if (store.logs.length > 200) {
    store.logs.shift();
  }
}

module.exports = async function handler(req, res) {
  try {
    const store = getStore();

    if (req.method !== 'GET') {
      pushLog('warn', 'method_not_allowed', { method: req.method });
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    store.totalHits += 1;
    store.lastVisits = (Number(store.lastVisits) || 0) + 1;
    store.lastError = null;

    pushLog('info', 'visit_request_success', {
      visits: store.lastVisits,
      path: req.url || '/api/visit'
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        visits: store.lastVisits,
        degraded: false,
        timestamp: new Date().toISOString()
      })
    );
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ visits: 1, degraded: true, error: 'Fallback response' }));
  }
};