// Vercel Serverless Function - Yahoo Finance 服务端代理
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, range = '1y' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
  };
  const params = `interval=1d&range=${range}&includePrePost=false`;
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${params}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${params}`,
  ];

  let lastErr = '';
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      const data = await r.json();
      if (!data?.chart?.result?.[0]?.timestamp?.length) { lastErr = 'empty result'; continue; }
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(data);
    } catch (e) { lastErr = e.message; }
  }
  return res.status(500).json({ error: `数据获取失败: ${lastErr}` });
};
