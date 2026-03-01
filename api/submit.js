// api/submit.js
// Vercel serverless function — handles waitlist form submissions
// Supports both Supabase and Airtable depending on env vars set

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { name, email, social, role, budget, stage, price_range, priority, referral_code, referred_by, submitted_at } = body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields: name, email, role' });
  }

  const results = [];

  // ── SUPABASE ──────────────────────────────────────────────────────────────
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          name, email, social, role,
          budget: budget || null,
          stage: stage || null,
          price_range: price_range || null,
          priority,
          referral_code,
          referred_by: referred_by || null,
          submitted_at: submitted_at || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Supabase error:', err);
        results.push({ dest: 'supabase', ok: false, error: err });
      } else {
        results.push({ dest: 'supabase', ok: true });
      }
    } catch (e) {
      console.error('Supabase exception:', e);
      results.push({ dest: 'supabase', ok: false, error: e.message });
    }
  }

  // ── AIRTABLE ─────────────────────────────────────────────────────────────
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Waitlist';
    try {
      const fields = {
        'Name': name,
        'Email': email,
        'Social': social || '',
        'Role': role,
        'Priority': priority || '',
        'Referral Code': referral_code || '',
        'Referred By': referred_by || '',
        'Submitted At': submitted_at || new Date().toISOString(),
      };
      // Role-specific fields
      if (role === 'collector') fields['Budget'] = budget || '';
      if (role === 'artist') {
        fields['Career Stage'] = stage || '';
        fields['Price Range'] = price_range || '';
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Airtable error:', err);
        results.push({ dest: 'airtable', ok: false, error: err });
      } else {
        results.push({ dest: 'airtable', ok: true });
      }
    } catch (e) {
      console.error('Airtable exception:', e);
      results.push({ dest: 'airtable', ok: false, error: e.message });
    }
  }

  // No backends configured — still return success (useful for local dev)
  if (results.length === 0) {
    console.log('No backend configured. Payload received:', body);
    return res.status(200).json({ ok: true, note: 'No backend configured — data logged to console' });
  }

  const allOk = results.every(r => r.ok);
  return res.status(allOk ? 200 : 207).json({ ok: allOk, results });
}
