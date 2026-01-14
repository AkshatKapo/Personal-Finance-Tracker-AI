// import { Router } from "express";
// import OpenAI from "openai";

// console.log("AI ROUTER LOADED");  // <-- ADD THIS LINE

// const router = Router();

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// console.log("API KEY:", process.env.OPENAI_API_KEY);


// router.post("/categorize", async (req, res) => {
//   try {
//     const { description } = req.body;

//     if (!description) {
//       return res.status(400).json({ error: "Description required" });
//     }

//     const prompt = `
// You are a finance assistant. Categorize this transaction into one category:
// ["Food", "Transportation", "Shopping", "Bills", "Entertainment", "Health", "Travel", "Other"].

// Transaction: "${description}"

// Return ONLY the category name.
// `;
// // 👉 Add it RIGHT HERE
// console.log("Calling OpenAI now...");

//     const response = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 10
//     });
//     // 👉 And add this one right after
// console.log("OpenAI responded!", response.choices[0].message.content);

//     const category = response.choices[0].message.content?.trim();

//     return res.json({ category });
//   } catch (e) {
//     console.error("AI error:", e);
//     return res.status(500).json({ error: "AI request failed" });
//   }
// });
import { Router } from "express";
import OpenAI from "openai";

console.log("AI ROUTER LOADED"); // <--- CONFIRM ROUTER LOADED

const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log("API KEY:", process.env.OPENAI_API_KEY ? "Loaded" : "MISSING!!!");


router.post("/categorize", async (req, res) => {
  console.log("HIT /categorize ROUTE"); // <--- CONFIRM ROUTE HIT
  console.log("REQ BODY:", req.body);   // <--- DEBUG BODY CONTENT

  try {
    const { description } = req.body;

    if (!description) {
      console.log("NO DESCRIPTION PROVIDED"); // <--- DEBUG
      return res.status(400).json({ error: "Description required" });
    }

    const prompt = `
You are a finance assistant. Categorize this transaction into one category:
["Food", "Groceries",Transportation", "Shopping", "Bills", "Entertainment", "Health", "Travel", "Other"].

Transaction: "${description}"

Return ONLY the category name.
`;

    console.log("Calling OpenAI now..."); // <--- IMPORTANT LOG

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
    });

    // console.log("OpenAI responded!", response.choices[0].message.content); // <--- IMPORTANT LOG

    console.log("OpenAI responded!", response.choices[0].message.content);
    console.log("Tokens used:", response.usage);
    const category = response.choices[0].message.content?.trim();

    return res.json({ category });

  } catch (e) {
    console.error("AI error:", e);
    return res.status(500).json({ error: "AI request failed" });
  }
});

export default router;

// export default router;
