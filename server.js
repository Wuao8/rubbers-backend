import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import Stripe from "stripe";

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================
   PRODUCTS (PRINTFUL MAP)
========================= */

const products = {
  black_tshirt_s: { sync_variant_id: 5313513882, price: 32 },
  black_tshirt_m: { sync_variant_id: 5313513883, price: 32 },
  black_tshirt_l: { sync_variant_id: 5313513884, price: 32 },

  white_tshirt_s: { sync_variant_id: 5313513886, price: 32 },
  white_tshirt_m: { sync_variant_id: 5313513887, price: 32 },
  white_tshirt_l: { sync_variant_id: 5313513888, price: 32 },

  shorts_s: { sync_variant_id: 5313531864, price: 38 },
  shorts_m: { sync_variant_id: 5313531865, price: 38 },
  shorts_l: { sync_variant_id: 5313531866, price: 38 },

  hat_black: { sync_variant_id: 5313527308, price: 33 },
  hat_white: { sync_variant_id: 5313527310, price: 33 }
};

/* =========================
   CORS (LIVE DOMAIN READY)
========================= */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));


/* =========================
   WEBHOOK STRIPE → PRINTFUL
========================= */

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {

  console.log("WEBHOOK HIT");

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("EVENT OK:", event.type);

  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {

    console.log("💰 Pagamento completato!");

    const session = event.data.object;
    const customer = session.customer_details;

    const sync_variant_id = parseInt(session.metadata.sync_variant_id);

    try {

      const response = await fetch("https://api.printful.com/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PRINTFUL_TOKEN}`
        },
        body: JSON.stringify({
          recipient: {
            name: customer.name,
            email: customer.email,
            address1: customer.address.line1,
            city: customer.address.city,
            country_code: customer.address.country,
            state: customer.address?.state || "NA"
          },
          items: [
            {
              sync_variant_id: sync_variant_id,
              quantity: 1
            }
          ]
        })
      });

      const data = await response.json();
      console.log("PRINTFUL RESPONSE:", data);

    } catch (err) {
      console.log("PRINTFUL ERROR:", err);
    }
  }

  res.json({ received: true });
});

/* =========================
   JSON PARSER
========================= */

app.use(express.json());

/* =========================
   CHECKOUT STRIPE
========================= */

app.post("/create-checkout-session", async (req, res) => {
  try {

    const { product_key } = req.body;

    const product = products[product_key];

    if (!product) {
      return res.status(400).json({ error: "Prodotto non valido" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      shipping_address_collection: {
        allowed_countries: ["IT", "US", "FR", "DE", "ES"]
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: product_key
            },
            unit_amount: product.price * 100
          },
          quantity: 1
        }
      ],

      metadata: {
        product_key: product_key,
        sync_variant_id: product.sync_variant_id.toString()
      },

      success_url: "https://rubberscompany.netlify.app/success.html",
      cancel_url: "https://rubberscompany.netlify.app/cancel.html"
    });

    console.log("✅ Checkout session creata");

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    res.status(500).json({ error: "Errore Stripe" });
  }
});



/* =========================
   SERVER START
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Server attivo su ${PORT}`);
});

