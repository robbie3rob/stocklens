export default async function handler(req, res) {
  // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const sys = `You are a next-gen stock intelligence AI. Analyze the stock ticker and return ONLY a single valid JSON object. No markdown, no backticks, no text before or after. Start with { and end with }.

Return this exact structure:
{
  "companyName": "Full company name",
  "edgeScore": 75,
  "verdict": "Buy",
  "sentiment": "Bullish",
  "signals": {
    "aiSentiment": { "score": 72, "label": "Bullish" },
    "momentum": { "score": 65, "label": "Strong" },
    "socialBuzz": { "score": 80, "label": "Very High" },
    "congressActivity": { "score": 55, "label": "Moderate" },
    "optionsFlow": { "score": 68, "label": "Bullish" },
    "insiderMoves": { "score": 60, "label": "Neutral" },
    "shortInterest": { "score": 45, "label": "Moderate" },
    "analystRatings": { "score": 72, "label": "Bullish" },
    "earningsSurprise": { "score": 78, "label": "Beat" },
    "unusualVolume": { "score": 55, "label": "Elevated" },
    "institutionalFlow": { "score": 62, "label": "Accumulating" },
    "fearGreed": { "score": 50, "label": "Neutral" },
    "macroSignal": { "score": 58, "label": "Mild Tailwind" },
    "fundamentals": { "score": 70, "label": "Strong" }
  },
  "summary": "3 sentence AI intelligence summary.",
  "opportunity": "2-3 sentences on biggest upside catalyst.",
  "risks": "2-3 sentences on top 2 risks.",
  "recommendation": "2-3 sentences with clear direct recommendation for a young first-time investor."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        system: sys,
        messages: [{ role: 'user', content: `Analyze this stock and return the JSON: ${ticker}` }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();
    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch(e) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json(result);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
