// Proxy Vercel para buscar notícias de mercado via Google News RSS
// Retorna JSON com headlines financeiras brasileiras

export default async function handler(req, res) {
  const allowedOrigin = req.headers.origin && req.headers.origin.includes('clientebasedmf.vercel.app')
    ? req.headers.origin
    : 'https://clientebasedmf.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const query = req.query.q || 'mercado financeiro brasil economia';
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query + ' when:1d') + '&hl=pt-BR&gl=BR&ceid=BR:pt-419';

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DMFBot/1.0)' }
    });

    if (!resp.ok) {
      return res.status(200).json({ items: [], error: 'RSS fetch failed: ' + resp.status });
    }

    const xml = await resp.text();

    // Parse XML simples — extrair items do RSS
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const source = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';

      if (title) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(),
          pubDate: pubDate.trim(),
          source: source.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
        });
      }
    }

    return res.status(200).json({ items: items });
  } catch (error) {
    return res.status(200).json({ items: [], error: error.message });
  }
}
