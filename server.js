const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const indexPath = path.join(__dirname, 'index.html');
const dataDir = path.join(__dirname, 'data');
const counterFile = path.join(dataDir, 'visits.json');

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
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  if (req.url === '/') {
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

  if (req.url === '/api/visit') {
    try {
      const visits = incrementVisits();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ visits }));
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch visits' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Visitor counter running on http://localhost:${port}`);
});