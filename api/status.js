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

module.exports = function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const store = getStore();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: true,
        mode: 'vercel-serverless',
        startedAt: store.startedAt,
        totalHits: store.totalHits,
        lastVisits: store.lastVisits,
        lastError: store.lastError,
        logs: store.logs.slice(-80),
        timestamp: new Date().toISOString()
      })
    );
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, mode: 'vercel-serverless', logs: [] }));
  }
};