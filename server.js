// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Varianti Printful
const variantBlack = process.env.VARIANT_BLACK; // 5071022105
const variantPink = process.env.VARIANT_PINK;   // 5071022108

app.post("/create-order", async (req, res) => {
  const { name, email, address1, city, country_code, color } = req.body;

  if (!name || !email || !address1 || !city || !country_code || !color) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti, incluso colore" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;

  // Seleziona variante in base al colore
  const selectedVariant = color.toLowerCase() === "black" ? variantBlack : variantPink;

  try {
    const response = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        recipient: { name, email, address1, city, country_code },
        items: [
          {
           variant_id: selectedVariant,
           quantity: 1,
           files: [
              {
               type: "embroidery_front",
               file: 903954654
              }
            ]
          }
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
