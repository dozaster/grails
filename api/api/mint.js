const { createClient } = require('@supabase/supabase-js');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  const { sale_id } = req.body;
  if (!sale_id) return res.status(400).json({ error: 'Missing sale_id' });

  // CONTRACT_ADDRESS not yet set — queue for later
  if (!process.env.CONTRACT_ADDRESS || !process.env.MINT_PRIVATE_KEY) {
    console.log(`Mint queued for sale ${sale_id} — contract not yet deployed`);
    await db.from('sales').update({ token_status: 'QUEUED' }).eq('id', sale_id);
    return res.json({ queued: true, message: 'Contract not deployed yet — mint queued' });
  }

  // Full mint logic lives here once CONTRACT_ADDRESS is set
  // See deploy-guide.md Step 10 for complete implementation
  res.json({ queued: true });
};
