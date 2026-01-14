import { Router } from "express";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper: get start of last week
function getLastWeekRange() {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

router.get("/weekly", async (req, res) => {
  try {
    const user: any = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { start, end } = getLastWeekRange();

    // 1. Get last week's expenses
    const txns = await prisma.transaction.findMany({
      where: {
        account: { userId: user.id },
        postedAt: { gte: start, lte: end },
        amountCents: { lt: 0 }, // expenses only
      },
    });

    if (txns.length === 0) {
      return res.json({ insights: "No transactions this week." });
    }

    // 2. Summaries
    const categories: Record<string, number> = {};
    for (const t of txns) {
      const cat = t.category || "Uncategorized";
      categories[cat] = (categories[cat] ?? 0) + Math.abs(t.amountCents);
    }

    const summaryText = Object.entries(categories)
      .map(([cat, cents]) => `${cat}: $${(cents / 100).toFixed(2)}`)
      .join("\n");

    // 3. Send to GPT
    const prompt = `
Here is a user's spending summary for the past week:

${summaryText}

Generate a short, friendly financial insight including:
- biggest spending category
- spending patterns
- suggestions to improve savings
- potential warnings (e.g., overspending)
Keep it under 120 words.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 180,
    });


    const insights = response.choices[0].message.content?.trim() || "";
    console.log("OpenAI responded!", response.choices[0].message.content);
    console.log("Tokens used:", response.usage);
   

    return res.json({ insights, summary: categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI insights failed" });
  }
});

export default router;
