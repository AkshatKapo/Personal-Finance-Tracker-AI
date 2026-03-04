import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * Helper: returns date range for last 7 days
 */
function getLastWeekRange() {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

/**
 * GET /api/ai/insights/weekly
 * Generates:
 *  - Spending summary (by category)
 *  - Mock AI insights (bullet-style)
 *  - Stock / investing readiness insights (rule-based)
 */
router.get("/weekly", async (req, res) => {
  try {
    /**
     * 🔐 Auth check
     * req.user is assumed to be set by auth middleware
     */
    const user: any = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    /**
     * 📅 Date range (last week)
     */
    const { start, end } = getLastWeekRange();

    /**
     * 💾 1. Fetch last week's EXPENSE transactions
     * (amountCents < 0 means money spent)
     */
    const txns = await prisma.transaction.findMany({
      where: {
        account: { userId: user.id },
        postedAt: { gte: start, lte: end },
        amountCents: { lt: 0 },
      },
    });

    /**
     * Edge case: no transactions
     */
    if (txns.length === 0) {
      return res.json({
        insights: "• No transactions recorded this week",
        summary: {},
        stockReadiness: [],
      });
    }

    /**
     * 📊 2. Build category spending summary
     * Example:
     * { Food: 5000, Transport: 1200 }
     */
    const categories: Record<string, number> = {};

    for (const t of txns) {
      const cat = t.category || "Uncategorized";
      categories[cat] =
        (categories[cat] ?? 0) + Math.abs(t.amountCents);
    }

    /**
     * ================================
     * 💹 3. STOCK READINESS LOGIC (NO AI)
     * ================================
     */

    // Total money spent this week
    const totalSpent = Object.values(categories).reduce(
      (sum, c) => sum + c,
      0
    );

    /**
     * TEMP income estimate (in cents)
     * Later: replace with real income data
     */
    const estimatedIncome = 200000; // $2000

    // Net cash flow = income - expenses
    const netCashFlow = estimatedIncome - totalSpent;

    /**
     * Build investing readiness insights
     * These are SAFE, rule-based, and explainable
     */
    const stockReadiness: string[] = [];

    if (netCashFlow > 50000) {
      stockReadiness.push(
        "• You have positive cash flow — you may be financially ready to consider investing"
      );
    } else if (netCashFlow > 0) {
      stockReadiness.push(
        "• Cash flow is positive but limited — focus on saving before investing"
      );
    } else {
      stockReadiness.push(
        "• Cash flow is negative — investing now may increase financial risk"
      );
    }

    // Spending discipline check
    if (totalSpent > estimatedIncome * 0.9) {
      stockReadiness.push(
        "• High spending relative to income detected — stabilize expenses before investing"
      );
    } else {
      stockReadiness.push(
        "• Spending is under control — this supports long-term investing goals"
      );
    }

    /**
     * ================================
     * 🤖 4. MOCK AI INSIGHTS (TEMP)
     * ================================
     * OpenAI is disabled due to quota.
     * This simulates final AI output style.
     */
    const insights =
      "• Food is your highest spending category this week\n" +
      "• Reducing dining out by $40 can help you stay on track\n" +
      "• Warning: spending pace is higher than last week\n" +
      "• Good job keeping transport costs stable";

    /**
     * ✅ Final API response
     */
    return res.json({
      insights,
      summary: categories,
      stockReadiness,
    });
  } catch (err) {
    console.error("Weekly insights error:", err);
    return res.status(500).json({
      error: "Failed to generate weekly insights",
    });
  }
});

export default router;



 // 3. Send to GPT
//     const prompt = `
// Here is a user's spending summary for the past week:

// ${summaryText}

// Generate a short, friendly financial insight including:
// - biggest spending category
// - spending patterns
// - suggestions to improve savings
// - potential warnings (e.g., overspending)
// Keep it under 120 words.
// `;

//     const response = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 180,
//     });


    // const insights = response.choices[0].message.content?.trim() || "";
    // console.log("OpenAI responded!", response.choices[0].message.content);
    // console.log("Tokens used:", response.usage);


    // return res.json({ insights, summary: categories });