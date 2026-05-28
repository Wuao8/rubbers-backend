import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import Stripe from "stripe";



const app = express();

const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


app.post("/test", (req, res) => {
  console.log("🔥 TEST WEBHOOK ARRIVATO");
  res.send("ok");
});



// CORS
app.use(cors({
  origin: "https://invetrina.netlify.app",
  methods: ["GET", "POST"],
  credentials: true
}));



const tshirtBlackS = 5313513882;





// WEBHOOK STRIPE
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {

  const sig = req.headers["stripe-signature"];

  let event;

  try {

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Webhook ricevuto:", event.type);

  } catch (err) {

    console.log("❌ Webhook signature failed:", err.message);

    return res.sendStatus(400);
  }






  if (event.type === "checkout.session.completed") {

    console.log("💰 Pagamento completato!");

    const session = event.data.object;

    const customer = session.customer_details;

    const variant_id = parseInt(session.metadata.variant_id);

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

            country_code: customer.address.country
          },

          items: [
            {
              variant_id: variant_id,
              quantity: 1
            }
          ]
        })
      });

      const data = await response.json();

      console.log("PRINTFUL SUCCESS:", data);

    } catch (err) {

      console.log("PRINTFUL ERROR:", err);
    }
  }

  res.json({ received: true });
});





// JSON PARSER
app.use(express.json());






// CREATE CHECKOUT SESSION
app.post("/create-checkout-session", async (req, res) => {
  console.log("STRIPE KEY:", process.env.STRIPE_SECRET_KEY?.slice(0, 10));
  try {

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
              name: "Rubbers T-Shirt Black S"
            },

            unit_amount: 3500
          },

          quantity: 1
        }
      ],

      metadata: {
        variant_id: tshirtBlackS.toString()
      },

      success_url: "https://invetrina.netlify.app/success.html",

      cancel_url: "https://invetrina.netlify.app/cancel.html"
    });

    console.log("✅ Checkout session creata");

    res.json({ url: session.url });

  } catch (err) {

    console.error("❌ CHECKOUT ERROR:", err);

    res.status(500).json({
      error: "Errore Stripe"
    });
  }
});







app.listen(PORT, () => {
  console.log(`🚀 Server attivo su ${PORT}`);
});

