const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { amount_pence, payment_method_id, catalogue_id, buyer_id } = req.body;

  if (!amount_pence || !payment_method_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:         amount_pence,
      currency:       'gbp',
      capture_method: 'manual', // authorise only — captured when seller accepts
      payment_method: payment_method_id,
      confirm:        true,
      return_url:     `${process.env.APP_URL}/marketplace.html`,
      metadata:       { catalogue_id, buyer_id },
    });

    res.json({
      payment_intent_id: paymentIntent.id,
      status:            paymentIntent.status,
    });
  } catch (err) {
    console.error('create-offer error:', err.message);
    res.status(400).json({ error: err.message });
  }
};
