// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const variantId = process.env.PRODUCT_ID;


app.use(cors());
app.use(express.json());

app.post("/create-order", async (req, res) => {
  const { name, email, address1, city, country_code } = req.body;

  if (!name || !email || !address1 || !city || !country_code) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;
  const productId = process.env.PRODUCT_ID;

  try {
    const response = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        recipient: {
          name,
          email,
          address1,
          city,
          country_code,
        },
        items: [
          {
            variant_id: variantId,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("Printful response:", data);

    if (data?.result?.checkout_url) {
      return res.json({ checkout: data.result.checkout_url });
    } else {
      return res.status(500).json({ error: "Impossibile creare l'ordine" });
    }
  } catch (error) {
    console.error("Errore backend:", error);
    return res.status(500).json({ error: "Errore interno al server" });
  }
});

app.listen(PORT, () => {
  console.log(`Server Rubbers backend attivo su porta ${PORT}`);
});

