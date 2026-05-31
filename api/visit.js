module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const response = await fetch('https://api.countapi.xyz/hit/sit-visitor-counter/homepage');
    const data = await response.json();

    if (!response.ok || typeof data.value !== 'number') {
      res.status(500).json({ error: 'Failed to fetch visits' });
      return;
    }

    res.status(200).json({ visits: data.value });
  } catch {
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
};