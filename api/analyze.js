export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
    const sys = `You are EdgeFlow, a next-gen stock intelligence AI. Return ONLY a valid JSON object. No markdown, no backticks. Start with { end with }.
{
  "companyName": "Full company name",
  "edgeScore": 74,
  "verdict": "Buy",
  "sentiment": "Bullish",
  "signals": {
    "congressActivity":  { "score": 65, "label": "Moderate Buying" },
    "analystRatings":    { "score": 78, "label": "Strong Buy" },
    "darkPool":          { "score": 72, "label": "Accumulating" },
    "ceoBuying":         { "score": 55, "label": "Neutral" },
    "putCallRatio":      { "score": 60, "label": "Slightly Bullish" },
    "aiSentiment":       { "score": 70, "label": "Bullish" },
    "momentum":          { "score": 68, "label": "Strong" },
    "socialBuzz":        { "score": 75, "label": "Very High" },
    "optionsFlow":       { "score": 65, "label": "Bullish" },
    "insiderMoves":      { "score": 50, "label": "Neutral" },
    "shortInterest":     { "score": 40, "label": "High Short" },
    "earningsSurprise":  { "score": 80, "label": "Beat" },
    "unusualVolume":     { "score": 60, "label": "Elevated" },
    "institutionalFlow": { "score": 70, "label": "Accumulating" },
    "macroSignal":       { "score": 55, "label": "Mild Tailwind" },
    "fundamentals":      { "score": 72, "label": "Strong" },
    "relativeStrength":  { "score": 68, "label": "Outperforming" }
  },
  "summary": "3 sentences about this stock for young investors.",
  "opportunity": "2-3 sentences on biggest upside catalyst.",
  "risks": "2-3 sentences on top 2 risks.",
  "recommendation": "2-3 sentences with clear actionable advice for a first-time investor."
}
Use the full 0-100 range. Make scores meaningfully different between stocks.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1500, system: sys, messages: [{ role: 'user', content: `Analyze stock: ${ticker}` }] })
    });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err.error?.message || 'API error' }); }
    const data = await response.json();
    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    let result;
    try { result = JSON.parse(raw); } catch(e) { const m = raw.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); else return res.status(500).json({ error: 'Parse error' }); }
    return res.status(200).json(result);
  } catch(e) { return res.status(500).json({ error: e.message }); }
}
