import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket, emitToTeam } from "./socket.js";
import { supabase } from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

/* -------------------- MIDDLEWARE -------------------- */

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function leaderOnly(req, res, next) {
  if (req.user.role !== "leader") {
    return res.status(403).json({ message: "Leader access only" });
  }
  next();
}

/* -------------------- STATIC CLIENT -------------------- */

if (NODE_ENV === "production") {
  const clientBuildPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));
}

/* -------------------- AUTH -------------------- */

app.post("/api/auth/register-leader", async (req, res) => {
  const { teamName, leaderName, username, password, pin } = req.body;

  if (!teamName || !leaderName || !username || !password || !pin) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ message: "PIN must be 4 digits" });
  }

  try {
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    let teamCode;
    while (true) {
      teamCode = String(Math.floor(100000 + Math.random() * 900000));
      const { data } = await supabase
        .from("teams")
        .select("id")
        .eq("code", teamCode)
        .maybeSingle();
      if (!data) break;
    }

    const teamId = uuidv4();
    const leaderId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await supabase.from("teams").insert({
      id: teamId,
      code: teamCode,
      name: teamName,
      pin,
    });

    await supabase.from("members").insert({
      id: leaderId,
      team_id: teamId,
      username,
      name: leaderName,
      password_hash: passwordHash,
      role: "leader",
      status: "active",
    });

    const token = jwt.sign(
      { userId: leaderId, teamId, role: "leader" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: leaderId, username, name: leaderName, role: "leader" },
      team: { id: teamId, code: teamCode, name: teamName },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("username", username)
      .single();

    if (!member) return res.status(400).json({ message: "Invalid login" });

    const match = await bcrypt.compare(password, member.password_hash);
    if (!match) return res.status(400).json({ message: "Invalid login" });

    if (member.status !== "active") {
      return res.status(403).json({ message: "Awaiting approval" });
    }

    const token = jwt.sign(
      {
        userId: member.id,
        teamId: member.team_id,
        role: member.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: member.id,
        username: member.username,
        name: member.name,
        role: member.role,
      },
    });
  } catch {
    res.status(400).json({ message: "Invalid login" });
  }
});

/* -------------------- TEAMS -------------------- */

app.get("/api/teams/me", authMiddleware, async (req, res) => {
  const { data: team } = await supabase
    .from("teams")
    .select("id, code, name")
    .eq("id", req.user.teamId)
    .single();

  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json(team);
});

app.get("/api/teams/members", authMiddleware, leaderOnly, async (req, res) => {
  const { data } = await supabase
    .from("members")
    .select("id, username, name, role, status")
    .eq("team_id", req.user.teamId);

  res.json(data);
});

/* -------------------- PRODUCTS -------------------- */

app.get("/api/products", authMiddleware, async (req, res) => {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("team_id", req.user.teamId);

  res.json(data);
});

app.post("/api/products", authMiddleware, leaderOnly, async (req, res) => {
  const { name, quantity, buyPrice, targetPrice } = req.body;

  const { data } = await supabase.from("products").insert({
    id: uuidv4(),
    team_id: req.user.teamId,
    name,
    quantity,
    buy_price: buyPrice,
    target_price: targetPrice,
  }).select().single();

  emitToTeam(req.user.teamId, "productUpdate");
  res.json(data);
});

/* -------------------- SALES -------------------- */

app.post("/api/sales", authMiddleware, async (req, res) => {
  console.log("JWT user:", req.user);
  const { productId, quantity, actualSellPrice } = req.body;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) return res.status(400).json({ message: "Product not found" });
  if (actualSellPrice < product.target_price) {
    return res.status(400).json({ message: "Price below target" });
  }

  const profit =
    (actualSellPrice - product.buy_price) * Number(quantity);

  await supabase.from("products").update({
    quantity: product.quantity - quantity,
  }).eq("id", productId);

  const { data } = await supabase.from("sales").insert({
    id: uuidv4(),
    team_id: req.user.teamId,
    product_id: productId,
    product_name: product.name,
    quantity,
    actual_sell_price: actualSellPrice,
    profit,
    sold_by: req.user.userId,
  }).select().single();

  emitToTeam(req.user.teamId, "productUpdate");
  res.json(data);
});

/* -------------------- MESSAGES -------------------- */

app.get("/api/messages", authMiddleware, async (req, res) => {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("team_id", req.user.teamId)
    .order("created_at", { ascending: false });

  res.json(data);
});

app.post("/api/messages", authMiddleware, leaderOnly, async (req, res) => {
  const { text } = req.body;

  const { data } = await supabase.from("messages").insert({
    id: uuidv4(),
    team_id: req.user.teamId,
    text,
    created_by: req.user.userId,
  }).select().single();

  emitToTeam(req.user.teamId, "teamMessage", data);
  res.json(data);
});

/* -------------------- PROFITS -------------------- */

app.post("/api/profits", authMiddleware, leaderOnly, async (req, res) => {
  const { pin } = req.body;

  const { data: team } = await supabase
    .from("teams")
    .select("pin")
    .eq("id", req.user.teamId)
    .single();

  if (!team || team.pin !== pin) {
    return res.status(403).json({ message: "Invalid PIN" });
  }

  const { data: sales } = await supabase
    .from("sales")
    .select("profit")
    .eq("team_id", req.user.teamId);

  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);
  res.json({ totalProfit });
});

/* -------------------- SPA FALLBACK -------------------- */

if (NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});