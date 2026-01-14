

console.log("booting index.ts...");
require("dotenv").config();


import type { Request, Response, NextFunction } from "express";
import aiRoutes from "./routes/ai.controller";
import aiInsights from "./routes/ai.insights";
import cron from "node-cron";
import moment from "moment-timezone";  



// runtime requires
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

// ---------- setup ----------
const prisma = new PrismaClient();
const app = express();
console.log("aiRoutes = ", aiRoutes);

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api/ai/insights", authMiddleware, aiInsights);


// types
type JWTPayload = { id: string; email: string };
type AuthedRequest = Request & { user: JWTPayload };

const JWT_SECRET: string = process.env.JWT_SECRET ?? "devsecret";
const PORT: number = Number(process.env.PORT ?? 4000);
// ---------- helpers ----------
function signToken(payload: JWTPayload): string {
  // add { expiresIn: "1h" } if you want expiry
  return jwt.sign(payload, JWT_SECRET);
}


function authMiddleware(
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
) {
  const auth = req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload; // verify & decode
    (req as any).user = decoded; // attach to request
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// find or create the user's default account
async function getOrCreateDefaultAccount(userId: string) {
  const existing = await prisma.account.findFirst({
    where: { userId, name: "Primary Checking" },
  });
  if (existing) return existing;

  return prisma.account.create({
    data: { userId, name: "Primary Checking", type: "checking" },
  });
}

// ---------- routes ----------

// login/upsert user -> return JWT
app.post("/auth/login", async (req: Request, res: Response) => {
  const { email, name } = (req.body ?? {}) as { email?: string; name?: string };
  if (!email) return res.status(400).json({ error: "email required" });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email, name } });

  const token = signToken({ id: user.id, email: user.email });
  return res.json({ token });
});

// who am I (protected)
app.get("/me", authMiddleware, async (req: AuthedRequest, res: Response) => {
  return res.json(req.user);
});

// seed sample data (protected) — no duplicate accounts
app.post("/seed", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const account = await getOrCreateDefaultAccount(req.user.id);

  await prisma.transaction.create({
    data: {
      accountId: account.id,
      postedAt: new Date(),
      description: "Test Coffee",
      amountCents: -450,
    },
  });

  return res.json({ ok: true });
});

// create a new transaction (protected)
// accepts either { amount: 12.34 } in dollars OR { amountCents: 1234 } in cents
app.post("/transactions", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      description,
      amount,
      amountCents,
      postedAt,
      accountId,
      category,
      isExpense,
      type,
    } = (req.body ?? {}) as {
      description?: string;
      amount?: number;
      amountCents?: number;
      postedAt?: string;
      accountId?: string;
      category?: string;
      isExpense?: boolean;
      type?: "expense" | "income";
    };

    if (!description) return res.status(400).json({ error: "description is required" });
    if (amount === undefined && amountCents === undefined) {
      return res.status(400).json({ error: "provide amount (dollars) or amountCents (integer)" });
    }

    // convert amount
    let cents: number;
    if (typeof amountCents === "number") {
      if (!Number.isInteger(amountCents)) {
        return res.status(400).json({ error: "amountCents must be an integer" });
      }
      cents = amountCents;
    } else {
      if (typeof amount !== "number" || !Number.isFinite(amount)) {
        return res.status(400).json({ error: "amount must be a number" });
      }
      cents = Math.round(amount * 100);
    }

    // enforce sign
    if (isExpense === true || type === "expense") cents = -Math.abs(cents);
    if (type === "income") cents = Math.abs(cents);

    // choose account
    let account;
    if (accountId) {
      account = await prisma.account.findFirst({
        where: { id: accountId, userId: req.user.id },
      });
      if (!account) return res.status(404).json({ error: "account not found for this user" });
    } else {
      account = await getOrCreateDefaultAccount(req.user.id);
    }

    // date
    const when = postedAt ? new Date(postedAt) : new Date();
    if (isNaN(when.getTime())) {
      return res.status(400).json({ error: "postedAt must be a valid date" });
    }

    // create transaction
    const txn = await prisma.transaction.create({
      data: {
        accountId: account.id,
        postedAt: when,
        description,
        amountCents: cents,
        category: category?.trim() || null,
      },
    });

 // ---------------- BUDGET CHECK + NOTIFICATION ----------------
if (category) {
  const trimmedCat = category.trim();

  const budget = await prisma.categoryBudget.findUnique({
    where: {
      userId_category: {
        userId: req.user.id,
        category: trimmedCat,
      },
    },
  });

  if (budget) {
    // Start of month
    const start = new Date();
    start.setDate(1);

    // How much the user spent this month on this category?
    const spending = await prisma.transaction.aggregate({
      where: {
        account: { userId: req.user.id },
        category: trimmedCat,
        postedAt: { gte: start },
        amountCents: { lt: 0 }, // expenses only
      },
      _sum: { amountCents: true },
    });

    const spent = Math.abs(spending._sum.amountCents ?? 0);

    if (spent > budget.capCents) {
      const message = `⚠️ You exceeded your ${trimmedCat} budget. Spent $${(
        spent / 100
      ).toFixed(2)} out of $${(budget.capCents / 100).toFixed(2)}.`;

      // Save notification
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          message,
        },
      });

      // Also include alert in API response
      return res.json({
        ...txn,
        alert: message,
        spent,
        budget: budget.capCents,
      });
    }
  }
}
    // -------------------------------------------------

    return res.status(201).json(txn);

  } catch (e) {
    console.error("POST /transactions error:", e);
    return res.status(500).json({ error: "internal error" });
  }
});


// list transactions (protected)
app.get("/transactions", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user.id },
    include: { txns: true },
  });
  const txns = accounts.flatMap((a: { txns: any[] }) => a.txns);
  return res.json(txns);
});
app.delete("/transactions/:id", authMiddleware, async(req: AuthedRequest, res:Response)=>
{
  try{
    const id = req.params.id;
    const result = await prisma.transaction.deleteMany({where: {id, account: { userId: req.user.id },
       // ownership check}})
  }
});
if (result.count === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /transactions/:id error:", e);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// Delete a category budget
app.delete("/budgets/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const id = req.params.id;
    await prisma.categoryBudget.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /budgets error:", err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});


// list my accounts (protected)
app.get("/accounts", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const accounts = await prisma.account.findMany({ where: { userId: req.user.id } });
  res.json(accounts);
});

// create a new account (protected)
app.post("/accounts", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const { name, type } = (req.body ?? {}) as { name?: string; type?: string };
  if (!name || !type) return res.status(400).json({ error: "name and type are required" });
  const account = await prisma.account.create({ data: { userId: req.user.id, name, type } });
  res.status(201).json(account);
});

app.get("/budgets", authMiddleware, async (req:AuthedRequest, res: Response) => {
  const items = await prisma.categoryBudget.findMany({
    where: { userId: (req as any).user.id },
    orderBy: { category: "asc" },
  });
  res.json(items);
});

app.post("/budgets", authMiddleware, async (req:AuthedRequest, res: Response) => {
  const { category, cap, capCents } =
    (req.body ?? {}) as { category?: string; cap?: number; capCents?: number };
  if (!category?.trim()) return res.status(400).json({ error: "category required" });

  let cents: number | null = null;
  if (Number.isInteger(capCents ?? null)) cents = capCents!;
  else if (typeof cap === "number" && Number.isFinite(cap)) cents = Math.round(cap * 100);
  if (cents === null) return res.status(400).json({ error: "cap or capCents required" });

  const item = await prisma.categoryBudget.upsert({
    where: { userId_category: { userId: (req as any).user.id, category: category.trim() } },
    create: { userId: (req as any).user.id, category: category.trim(), capCents: cents },
    update: { capCents: cents },
  });
  res.json(item);
});

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

app.get("/budgets/progress", authMiddleware, async (req:AuthedRequest, res: Response) => {
  const userId = (req as any).user.id;
  const budgets = await prisma.categoryBudget.findMany({ where: { userId } });
  const txns = await prisma.transaction.findMany({
    where: {
      account: { userId },
      postedAt: { gte: startOfMonth(), lte: new Date() },
      amountCents: { lt: 0 },
    },
    select: { category: true, amountCents: true },
  });

  const spent: Record<string, number> = {};
  for (const t of txns) {
    const cat = (t.category ?? "Uncategorized").trim();
    spent[cat] = (spent[cat] ?? 0) + Math.abs(t.amountCents);
  }

  res.json(budgets.map((b: { id: string; category: string; capCents: number }) => ({
    id: b.id, category: b.category, capCents: b.capCents, spentCents: spent[b.category] ?? 0,
  })));
});
// GET /settings  -> { monthlyIncomeCents: number | null }
app.get("/settings", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { monthlyIncomeCents: true },
  });
  res.json(user ?? { monthlyIncomeCents: null });
});

// POST /settings  body: { monthlyIncome?: number } OR { monthlyIncomeCents?: number }
app.post("/settings", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const { monthlyIncome, monthlyIncomeCents } =
    (req.body ?? {}) as { monthlyIncome?: number; monthlyIncomeCents?: number };

  let cents: number | null = null;
  if (typeof monthlyIncomeCents === "number" && Number.isInteger(monthlyIncomeCents)) {
    cents = monthlyIncomeCents;
  } else if (typeof monthlyIncome === "number" && Number.isFinite(monthlyIncome)) {
    cents = Math.round(monthlyIncome * 100);
  }
  if (cents === null) return res.status(400).json({ error: "Provide monthlyIncome (dollars) or monthlyIncomeCents (integer)" });

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { monthlyIncomeCents: cents },
    select: { monthlyIncomeCents: true },
  });

  res.json(updated);
});
app.get("/notifications", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const list = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});
app.post("/notifications/send", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const notif = await prisma.notification.create({
      data: {
        userId: req.user.id,
        message: message, // only this field exists
      },
    });

    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
async function checkUpcomingBills() {
  try {
    console.log("🔍 Checking upcoming bills...");

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const upcoming = await prisma.bill.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: tomorrow
        }
      }
    });

    for (const bill of upcoming) {
      await prisma.notification.create({
        data: {
          userId: bill.userId,
          message: `${bill.name} of $${bill.amount} is due tomorrow.`
        }
      });
    }

    console.log("✅ Bill check completed.");
  } catch (err) {
    console.error("⚠️ Error checking bills:", err);
  }
}


(async () => {
  console.log("🚀 Running startup bill check...");
  await checkUpcomingBills();
})();

// Runs every day at 8:00 AM Toronto time
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running 8AM daily bill check...");
  await checkUpcomingBills();
}, {
  timezone: "America/Toronto",
  
});


app.post("/bills/create", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, amount, dueDate, frequency } = req.body;

    if (!name || !amount || !dueDate || !frequency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 👉 Convert LOCAL TIME (Toronto) → UTC
    const dueDateUTC = moment.tz(dueDate, "America/Toronto").toDate();

    const bill = await prisma.bill.create({
      data: {
        userId: req.user.id,
        name,
        amount: parseFloat(amount),
        dueDate: dueDateUTC,
        frequency
      }
    });

    res.json(bill);
  } catch (err) {
    console.error("Error creating bill:", err);
    res.status(500).json({ error: "Could not create bill" });
  }
});
app.get("/bills", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: "asc" }
    });

    res.json(bills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch bills" });
  }
});

app.get("/bills/summary", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { userId: req.user.id }
    });

    const monthlyTotal = bills.reduce((sum: number, bill: { frequency: string; amount: number; }) => {
      if (bill.frequency === "monthly") return sum + bill.amount;
      if (bill.frequency === "weekly") return sum + bill.amount * 4.33;  // weeks/month
      if (bill.frequency === "yearly") return sum + bill.amount / 12;
      return sum;
    }, 0);

    res.json({
      monthlyTotal: Number(monthlyTotal.toFixed(2)),
      count: bills.length
    });

  } catch (err) {
    console.error("Error creating bill summary:", err);
    res.status(500).json({ error: "Could not fetch summary" });
  }
});





// ---------- start ----------
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
