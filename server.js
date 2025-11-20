// server.js
import express from "express";
import fetch from "node-fetch"; // se usi Node 18+ puoi usare fetch nativo
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint per creare l'ordine su Printful
app.post("/create-order", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Nome ed email richiesti" });
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
        recipient: { name, email },
        items: [{ sync_product_id: productId, quantity: 1 }],
      }),
    });

    const data = await response.json();

    if (data && data.result && data.result.checkout_url) {
      return res.json({ checkout: data.result.checkout_url });
    } else {
      console.error("Printful response:", data);
      return res.status(500).json({ error: "Impossibile creare l'ordine" });
    }
  } catch (error) {
    console.error("Errore backend:", error);
    return res.status(500).json({ error: "Errore interno al server" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server Rubbers backend attivo su porta ${PORT}`);
});
