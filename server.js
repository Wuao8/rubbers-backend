// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Varianti Beanie
const variantBlack = process.env.VARIANT_BLACK; // 5071022105
const variantPink = process.env.VARIANT_PINK;   // 5071022108

// Varianti felpa hoodie
const hoodieS  = 5092884681;
const hoodieM  = 5092884682;
const hoodieL  = 5092884683;
const hoodieXL = 5092884684;


// Varianti felpa t-shirt
const tshirtS  = 5092899867;
const tshirtM  = 5092899869;
const tshirtL  = 5092899871;
const tshirtXL = 5092899872;





app.post("/create-order", async (req, res) => {
  const { name, email, address1, city, country_code, color } = req.body;

  if (!name || !email || !address1 || !city || !country_code || !color) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti, incluso colore" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;
  const selectedVariant = color.toLowerCase() === "black" ? variantBlack : variantPink;

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
          variant_id: selectedVariant,
          quantity: 1,

          options: [
            {
              id: "thread_colors",
              value: ["#CC3333"]
            }
          ],

          files: [
            {
              type: "embroidery_front",
              url: "https://www.printful.com/library/file/903954654/download?lang=it"
            }
          ]
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


app.post("/create-order-hoodie", async (req, res) => {
  const { name, email, address1, city, country_code, size } = req.body;

  if (!name || !email || !address1 || !city || !country_code || !size) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti, inclusa la taglia" });
  }

  // Scegli variante in base alla taglia
  let selectedVariant;
  switch (size.toUpperCase()) {
    case "S":  selectedVariant = hoodieS; break;
    case "M":  selectedVariant = hoodieM; break;
    case "L":  selectedVariant = hoodieL; break;
    case "XL": selectedVariant = hoodieXL; break;
    default:
      return res.status(400).json({ error: "Taglia non valida" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;

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
            variant_id: selectedVariant,
            quantity: 1,
            files: [
              {
                type: "embroidery_front",
                url: "https://www.printful.com/library/file/903954654/download?lang=it"
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    console.log("Printful hoodie response:", data);

    if (data?.result?.checkout_url) {
      return res.json({ checkout: data.result.checkout_url });
    } else {
      return res.status(500).json({ error: "Impossibile creare l'ordine per la felpa" });
    }

  } catch (error) {
    console.error("Errore hoodie backend:", error);
    return res.status(500).json({ error: "Errore interno al server" });
  }
});



app.post("/create-order-tshirt", async (req, res) => {
  const { name, email, address1, city, country_code, size } = req.body;

  if (!name || !email || !address1 || !city || !country_code || !size) {
    return res.status(400).json({ error: "Tutti i campi sono richiesti, inclusa la taglia" });
  }

  // Scegli variante in base alla taglia
  let selectedVariant;
  switch (size.toUpperCase()) {
    case "S":  selectedVariant = tshirtS; break;
    case "M":  selectedVariant = tshirtM; break;
    case "L":  selectedVariant = tshirtL; break;
    case "XL": selectedVariant = tshirtXL; break;
    default:
      return res.status(400).json({ error: "Taglia non valida" });
  }

  const apiToken = process.env.PRINTFUL_TOKEN;

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
            variant_id: selectedVariant,
            quantity: 1,
            files: [
              {
                type: "High-quality DTG print",
                url: "https://www.printful.com/library/file/903954654/download?lang=it"
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    console.log("Printful tshirt response:", data);

    if (data?.result?.checkout_url) {
      return res.json({ checkout: data.result.checkout_url });
    } else {
      return res.status(500).json({ error: "Impossibile creare l'ordine per la t-shirt" });
    }

  } catch (error) {
    console.error("Errore tshirt backend:", error);
    return res.status(500).json({ error: "Errore interno al server" });
  }
});




app.listen(PORT, () => {
  console.log(`Server Rubbers backend attivo su porta ${PORT}`);
});
