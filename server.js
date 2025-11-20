// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ENV: metti questi valori come variabili d'ambiente (non committarle!)
const PRINTFUL_TOKEN = process.env.PRINTFUL_TOKEN;
const PRODUCT_ID = process.env.PRODUCT_ID;

// porta (Render fornirà process.env.PORT)
const PORT = process.env.PORT || 3000;

if (!PRINTFUL_TOKEN) {
  console.warn("Warning: PRINTFUL_TOKEN non impostato. Impostalo nelle ENV.");
}
if (!PRODUCT_ID) {
  console.warn("Warning: PRODUCT_ID non impostato. Impostalo nelle ENV.");
}

// endpoint per creare l'ordine e ottenere checkout_url
app.post("/create-order", async (req, res) => {
  try {
    // validazione minima dei parametri in ingresso
    const { name, email, quantity = 1 } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: "Missing name or email in request body." });
    }

    // costruisci il body che Printful si aspetta
    const payload = {
      recipient: {
        name,
        email
      },
      items: [
        {
          sync_product_id: PRODUCT_ID,
          quantity: Number(quantity)
        }
      ],
      // opzionale: force_shipping, external_id, etc.
    };

    const orderResponse = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PRINTFUL_TOKEN}`
      },
      body: JSON.stringify(payload),
      // timeout / retries non gestiti qui per semplicità
    });

    const data = await orderResponse.json();
    console.log("Printful response:", JSON.stringify(data));

    if (data && data.result && data.result.checkout_url) {
      return res.json({ checkout: data.result.checkout_url });
    }

    // se Printful ritorna errore, inoltralo al frontend per debug (attenzione ai dati sensibili)
    return res.status(400).json({ error: "No checkout URL returned", details: data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// health check semplice
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
