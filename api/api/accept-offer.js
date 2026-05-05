const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { offer_id, seller_stripe_connect_id } = req.body;

  if (!offer_id) return res.status(400).json({ error: 'Missing offer_id' });

  try {
    // 1. Get offer
    const { data: offer, error: offerErr } = await db
      .from('offers')
      .select('*')
      .eq('id', offer_id)
      .single();

    if (offerErr || !offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Offer no longer pending' });

    // 2. Capture payment
    await stripe.paymentIntents.capture(offer.stripe_payment_intent_id);

    // 3. Fee split
    // Buyer paid: ask price + 12% fee (collected at offer time)
    // Seller receives: 100% of ask (zero seller fees)
    // Platform keeps: 12% buyer fee minus 3% royalty = 9% net
    const askPence    = offer.amount_pence;
    const royalty     = Math.round(askPence * 0.03);
    const platformFee = Math.round(askPence * 0.12);
    const sellerNet   = askPence;

    // 4. Transfer to seller (if they have Stripe Connect)
    let transferId = null;
    if (seller_stripe_connect_id) {
      const transfer = await stripe.transfers.create({
        amount:      sellerNet,
        currency:    'gbp',
        destination: seller_stripe_connect_id,
      });
      transferId = transfer.id;
    }

    // 5. Update offer status
    await db.from('offers').update({ status: 'ACCEPTED' }).eq('id', offer_id);

    // 6. Update listing status
    if (offer.listing_id) {
      await db.from('listings').update({ status: 'SOLD' }).eq('id', offer.listing_id);
    }

    // 7. Create sale record
    const { data: sale } = await db.from('sales').insert([{
      listing_id:               offer.listing_id,
      offer_id:                 offer_id,
      sale_price_pence:         askPence,
      platform_fee_pence:       platformFee,
      royalty_pence:            royalty,
      seller_net_pence:         sellerNet,
      stripe_payment_intent_id: offer.stripe_payment_intent_id,
      stripe_transfer_id:       transferId,
      token_status:             'PENDING',
    }]).select().single();

    // 8. Royalty escrow — get artist name from catalogue
    try {
      const { data: listing } = await db.from('listings').select('catalogue_id').eq('id', offer.listing_id).single();
      const { data: work }    = await db.from('aa_catalogue').select('artist').eq('id', listing.catalogue_id).single();
      await db.from('royalty_escrow').insert([{
        sale_id:      sale.id,
        artist_name:  work.artist,
        amount_pence: royalty,
        status:       'UNCLAIMED',
      }]);
    } catch(e) {
      console.error('Royalty escrow error (non-blocking):', e.message);
    }

    // 9. Trigger Origin Token mint (non-blocking — sale completes regardless)
    fetch(`${process.env.APP_URL}/api/mint`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sale_id: sale.id }),
    }).catch(e => console.error('Mint trigger failed (non-blocking):', e.message));

    res.json({ success: true, sale_id: sale.id });
  } catch (err) {
    console.error('accept-offer error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
