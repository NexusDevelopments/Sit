const { getStore, recentLogs } = require('./_shared');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const store = getStore();

  res.status(200).json({
    ok: true,
    mode: 'vercel-serverless',
    startedAt: store.startedAt,
    totalHits: store.totalHits,
    lastVisits: store.lastVisits,
    lastError: store.lastError,
    logs: recentLogs(80),
    timestamp: new Date().toISOString()
  });
};