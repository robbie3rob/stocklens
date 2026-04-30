export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { ticker } = req.query;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });
    const response = await fetch(`https://www.capitoltrades.com/trades?ticker=${ticker}&pageSize=30`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' }
    });
    if (!response.ok) throw new Error('Failed to fetch');
    const html = await response.text();
    return res.status(200).send(html);
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
