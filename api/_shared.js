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
  const entry = {
    id: store.nextId++,
    time: new Date().toISOString(),
    level,
    event,
    meta: meta || {}
  };

  store.logs.push(entry);
  if (store.logs.length > 200) {
    store.logs.shift();
  }

  return entry;
}

function recentLogs(limit) {
  const store = getStore();
  const size = Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 50;
  return store.logs.slice(-size);
}

module.exports = {
  getStore,
  pushLog,
  recentLogs
};