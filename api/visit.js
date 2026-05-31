const https = require('https');

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

    request.setTimeout(5000, () => {
      request.destroy(new Error('Counter service timed out'));
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const visits = await hitCounter();
    res.status(200).json({ visits });
  } catch {
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
};