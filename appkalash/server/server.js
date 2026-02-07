import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket, emitToTeam } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Render persistent storage path if on Render, otherwise local path
// Render free tier persists data at /opt/render/project/src
const DB_PATH = process.env.RENDER
  ? "/opt/render/project/src/data/db.json"
  : path.resolve(__dirname, "../data/db.json");

const JWT_SECRET = process.env.JWT_SECRET || "teamstock-pro-secret";
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

// CORS configuration for both development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  process.env.CLIENT_URL, // Set this in Render environment variables
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      // In production, allow same origin (single server deployment)
      if (NODE_ENV === "production" && !origin.includes("localhost")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for simplicity on Render
    },
    credentials: true,
  })
);
app.use(express.json());

let writeQueue = Promise.resolve();

// Ensure database directory exists before any read/write operations
async function ensureDBExists() {
  const dbDir = path.dirname(DB_PATH);

  // Ensure directory exists
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }

  // Ensure db.json exists
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData = {
      teams: []
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

async function readDB() {
  await ensureDBExists();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  writeQueue = writeQueue.then(async () => {
    await ensureDBExists();
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  });
  return writeQueue;
}

async function updateDB(mutator) {
  const db = await readDB();
  const result = await mutator(db);
  await writeDB(db);
  return result;
}

function generateTeamCode(existingCodes) {
  let code = "";
  while (!code || existingCodes.has(code)) {
    code = String(Math.floor(100000 + Math.random() * 900000));
  }
  return code;
}

function sanitizeTeam(team) {
  const sanitizedMembers = team.members.map((m) => ({
    id: m.id,
    username: m.username,
    name: m.name,
    role: m.role,
    status: m.status,
  }));
  return {
    ...team,
    members: sanitizedMembers,
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function leaderOnly(req, res, next) {
  if (req.user?.role !== "leader") {
    return res.status(403).json({ message: "Leader access only" });
  }
  return next();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: NODE_ENV, dbPath: DB_PATH });
});

// Serve static files from React build in production
if (NODE_ENV === "production") {
  const clientBuildPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));
  console.log(`Serving static files from: ${clientBuildPath}`);
}

app.post("/api/auth/register-leader", async (req, res) => {
  const { teamName, leaderName, username, password, pin } = req.body || {};
  if (!teamName || !leaderName || !username || !password || !pin) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (!/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ message: "PIN must be 4 digits" });
  }

  try {
    const result = await updateDB(async (db) => {
      const existingUsers = db.teams.flatMap((t) => t.members);
      if (existingUsers.some((u) => u.username === username)) {
        throw new Error("Username already exists");
      }

      const existingCodes = new Set(db.teams.map((t) => t.code));
      const code = generateTeamCode(existingCodes);
      const teamId = uuidv4();
      const leaderId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);

      const team = {
        id: teamId,
        code,
        name: teamName,
        pin: String(pin),
        members: [
          {
            id: leaderId,
            username,
            name: leaderName,
            passwordHash,
            role: "leader",
            status: "active",
          },
        ],
        products: [],
        sales: [],
        messages: [],
      };

      db.teams.push(team);

      const token = jwt.sign(
        { userId: leaderId, teamId, role: "leader" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const leader = team.members[0];
      return {
        token,
        user: {
          id: leader.id,
          username: leader.username,
          name: leader.name,
          role: leader.role,
          status: leader.status,
        },
        team: sanitizeTeam(team),
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

app.post("/api/auth/join-team", async (req, res) => {
  const { teamCode, name, username, password } = req.body || {};
  if (!teamCode || !name || !username || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await updateDB(async (db) => {
      const team = db.teams.find((t) => t.code === String(teamCode));
      if (!team) throw new Error("Team not found");

      const existingUsers = db.teams.flatMap((t) => t.members);
      if (existingUsers.some((u) => u.username === username)) {
        throw new Error("Username already exists");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      team.members.push({
        id: uuidv4(),
        username,
        name,
        passwordHash,
        role: "member",
        status: "pending",
      });
    });

    return res.json({ message: "Request submitted for approval" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const db = await readDB();
    const team = db.teams.find((t) =>
      t.members.some((m) => m.username === username)
    );
    if (!team) return res.status(400).json({ message: "Invalid login" });

    const user = team.members.find((m) => m.username === username);
    if (!user) return res.status(400).json({ message: "Invalid login" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Invalid login" });
    if (user.status !== "active") {
      return res.status(403).json({ message: "Awaiting approval" });
    }

    const token = jwt.sign(
      { userId: user.id, teamId: team.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      team: sanitizeTeam(team),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/teams/me", authMiddleware, async (req, res) => {
  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  return res.json(sanitizeTeam(team));
});

app.get("/api/teams/members", authMiddleware, leaderOnly, async (req, res) => {
  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  return res.json(sanitizeTeam(team).members);
});

app.post(
  "/api/teams/members/:memberId/approve",
  authMiddleware,
  leaderOnly,
  async (req, res) => {
    const { memberId } = req.params;
    try {
      await updateDB(async (db) => {
        const team = db.teams.find((t) => t.id === req.user.teamId);
        if (!team) throw new Error("Team not found");
        const member = team.members.find((m) => m.id === memberId);
        if (!member) throw new Error("Member not found");
        member.status = "active";
      });
      return res.json({ message: "Member approved" });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

app.delete(
  "/api/teams/members/:memberId",
  authMiddleware,
  leaderOnly,
  async (req, res) => {
    const { memberId } = req.params;
    try {
      await updateDB(async (db) => {
        const team = db.teams.find((t) => t.id === req.user.teamId);
        if (!team) throw new Error("Team not found");
        team.members = team.members.filter((m) => m.id !== memberId);
      });
      return res.json({ message: "Member removed" });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

app.get("/api/products", authMiddleware, async (req, res) => {
  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  return res.json(team.products);
});

app.post("/api/products", authMiddleware, leaderOnly, async (req, res) => {
  const { name, quantity, buyPrice, targetPrice } = req.body || {};
  if (!name || quantity == null || buyPrice == null || targetPrice == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let createdProduct;
    await updateDB(async (db) => {
      const team = db.teams.find((t) => t.id === req.user.teamId);
      if (!team) throw new Error("Team not found");
      createdProduct = {
        id: uuidv4(),
        name,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        targetPrice: Number(targetPrice),
        createdAt: new Date().toISOString(),
      };
      team.products.push(createdProduct);
    });

    emitToTeam(req.user.teamId, "productUpdate", { type: "add" });
    return res.json(createdProduct);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

app.get("/api/sales", authMiddleware, async (req, res) => {
  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  return res.json(team.sales);
});

app.post("/api/sales", authMiddleware, async (req, res) => {
  const { productId, quantity, actualSellPrice } = req.body || {};
  if (!productId || quantity == null || actualSellPrice == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let saleRecord;
    await updateDB(async (db) => {
      const team = db.teams.find((t) => t.id === req.user.teamId);
      if (!team) throw new Error("Team not found");
      const product = team.products.find((p) => p.id === productId);
      if (!product) throw new Error("Product not found");

      const qty = Number(quantity);
      const price = Number(actualSellPrice);

      if (price < product.targetPrice) {
        throw new Error("Actual sell price must be >= target price");
      }
      if (qty <= 0 || qty > product.quantity) {
        throw new Error("Invalid quantity");
      }

      product.quantity -= qty;
      const profit = (price - product.buyPrice) * qty;

      saleRecord = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity: qty,
        buyPrice: product.buyPrice,
        targetPrice: product.targetPrice,
        actualSellPrice: price,
        profit,
        soldBy: req.user.userId,
        soldAt: new Date().toISOString(),
      };

      team.sales.push(saleRecord);
    });

    emitToTeam(req.user.teamId, "productUpdate", { type: "sale" });
    return res.json(saleRecord);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

app.post("/api/profits", authMiddleware, leaderOnly, async (req, res) => {
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ message: "PIN required" });

  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  if (String(pin) !== String(team.pin)) {
    return res.status(403).json({ message: "Invalid PIN" });
  }

  const totalProfit = team.sales.reduce((sum, sale) => sum + sale.profit, 0);
  return res.json({ totalProfit, sales: team.sales });
});

app.get("/api/messages", authMiddleware, async (req, res) => {
  const db = await readDB();
  const team = db.teams.find((t) => t.id === req.user.teamId);
  if (!team) return res.status(404).json({ message: "Team not found" });
  return res.json(team.messages || []);
});

app.post("/api/messages", authMiddleware, leaderOnly, async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ message: "Text required" });

  try {
    let message;
    await updateDB(async (db) => {
      const team = db.teams.find((t) => t.id === req.user.teamId);
      if (!team) throw new Error("Team not found");
      message = {
        id: uuidv4(),
        text,
        createdAt: new Date().toISOString(),
        createdBy: req.user.userId,
      };
      team.messages.push(message);
    });

    emitToTeam(req.user.teamId, "teamMessage", message);
    return res.json(message);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Catch-all route: serve React index.html for client-side routing
// Must be AFTER all API routes
if (NODE_ENV === "production") {
  app.get("*", (req, res) => {
    const indexPath = path.resolve(__dirname, "../client/dist/index.html");
    res.sendFile(indexPath);
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Database: ${DB_PATH}`);
});
