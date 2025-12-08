// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Varianti Printful per prodotto
const variants = {
  tshirt: {
    S: 5092899867,
    M: 5092899869,
    L: 5092899871,
    XL: 5092899872,
  },
  hoodie: {
    S: 5092884681,
    M: 5092884682,
    L: 5092884683,
    XL: 5092884684,
  },
  specialTshirt: {
    "Black-S": 5095669082,
    "Black-M": 5095669083,
    "Black-L": 5095669084,
    "Black-XL": 5095669085,
    "White-S": 5095669086,
    "White-M": 5095669087,
    "White-L": 5095669088,
    "White-XL": 5095669089,
  },
};

app.post("/create-order", async (req, res) => {
  const { name, email, address1, city, country_code, product, size, color } = req.body;

  if (!name || !email || !address1 || !city || !country_code || !product || !size) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti: nome, email, indirizzo, città, paese, prodotto e taglia" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;

  let selectedVariant;

  // Selezione variante in base al prodotto
  if (product === "tshirt") {
    selectedVariant = variants.tshirt[size];
  } else if (product === "hoodie") {
    selectedVariant = variants.hoodie[size];
  } else if (product === "specialTshirt") {
    if (!color) return res.status(400).json({ error: "Colore richiesto per Special T-shirt" });
    selectedVariant = variants.specialTshirt[`${color}-${size}`];
  } else {
    return res.status(400).json({ error: "Prodotto non valido" });
  }

  if (!selectedVariant) return res.status(400).json({ error: "Variante non trovata" });

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
          }
        ]
      })
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
