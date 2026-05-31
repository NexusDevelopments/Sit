const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const indexPath = path.join(__dirname, 'index.html');
const cdsPath = path.join(__dirname, 'cds.html');
const dataDir = path.join(__dirname, 'data');
const counterFile = path.join(dataDir, 'visits.json');
const startedAt = new Date().toISOString();
const logs = [];
let totalHits = 0;
let lastError = null;

function pushLog(level, event, meta) {
  const entry = {
    time: new Date().toISOString(),
    level,
    event,
    meta: meta || {}
  };

  logs.push(entry);
  if (logs.length > 200) {
    logs.shift();
  }

  return entry;
}

function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(counterFile)) {
    fs.writeFileSync(counterFile, JSON.stringify({ visits: 0 }, null, 2));
  }
}

function readVisits() {
  try {
    const raw = fs.readFileSync(counterFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed.visits) ? parsed.visits : 0;
  } catch {
    return 0;
  }
}

function incrementVisits() {
  const nextVisits = readVisits() + 1;
  fs.writeFileSync(counterFile, JSON.stringify({ visits: nextVisits }, null, 2));
  return nextVisits;
}

ensureStorage();

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname;

  totalHits += 1;
  pushLog('info', 'request_received', { method: req.method, path: req.url });

  if (req.method !== 'GET') {
    pushLog('warn', 'method_not_allowed', { method: req.method });
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  if (pathname === '/') {
    fs.readFile(indexPath, 'utf8', (err, html) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Failed to load page');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  if (pathname === '/cds' || pathname === '/cds.html') {
    fs.readFile(cdsPath, 'utf8', (err, html) => {
      if (err) {
        pushLog('error', 'cds_page_load_failed', {});
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Failed to load debug page');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  if (pathname === '/api/visit') {
    try {
      const visits = incrementVisits();
      lastError = null;
      pushLog('info', 'visit_incremented', { visits });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ visits }));
    } catch {
      lastError = 'Local counter failed';
      pushLog('error', 'visit_increment_failed', {});
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch visits' }));
    }
    return;
  }

  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        ok: true,
        mode: 'local-node',
        startedAt,
        totalHits,
        lastVisits: readVisits(),
        lastError,
        logs: logs.slice(-80),
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  pushLog('warn', 'route_not_found', { path: req.url });
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Visitor counter running on http://localhost:${port}`);
});