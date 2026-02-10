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

/* ==================== SETUP ==================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

/* ==================== MIDDLEWARE ==================== */

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* ---- FORCE JSON FOR API ---- */
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

/* ==================== AUTH HELPERS ==================== */

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function leaderOnly(req, res, next) {
  if (req.user.role !== "leader") {
    return res.status(403).json({ message: "Leader only" });
  }
  next();
}

/* ==================== STATIC CLIENT ==================== */

if (NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../client/dist")));
}

/* ==================== AUTH ==================== */

app.post("/api/auth/register-leader", async (req, res) => {
  try {
    const { teamName, leaderName, username, password, pin } = req.body;

    if (!teamName || !leaderName || !username || !password || !pin) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be 4 digits" });
    }

    const { data: exists } = await supabase
      .from("members")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (exists) {
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
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("username", username)
      .single();

    if (!member) {
      return res.status(400).json({ message: "Invalid login" });
    }

    const ok = await bcrypt.compare(password, member.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid login" });
    }

    if (member.status !== "active") {
      return res.status(403).json({ message: "Awaiting approval" });
    }

    const { data: team } = await supabase
      .from("teams")
      .select("id, code, name")
      .eq("id", member.team_id)
      .single();

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const token = jwt.sign(
      { userId: member.id, teamId: member.team_id, role: member.role },
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
      team,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/join-team", async (req, res) => {
  try {
    const { teamCode, name, username, password } = req.body;

    if (!teamCode || !name || !username || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("code", teamCode)
      .maybeSingle();

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const memberId = uuidv4();
    const { error: insertError } = await supabase.from("members").insert({
      id: memberId,
      team_id: team.id,
      username,
      name,
      password_hash: passwordHash,
      role: "member",
      status: "pending",
    });

    if (insertError) {
      return res.status(500).json({ message: "Failed to submit request" });
    }

    emitToTeam(team.id, "memberUpdate", { memberId, status: "pending" });
    res.json({ message: "Request sent for approval" });
  } catch (err) {
    console.error("JOIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== TEAMS ==================== */

app.get("/api/teams/me", authMiddleware, async (req, res) => {
  try {
    const { data: team, error } = await supabase
      .from("teams")
      .select("id, code, name")
      .eq("id", req.user.teamId)
      .single();

    if (error || !team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    console.error("TEAM ME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/teams/members", authMiddleware, leaderOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("id, username, name, role, status")
      .eq("team_id", req.user.teamId)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ message: "Failed to load members" });
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("TEAM MEMBERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch(
  "/api/teams/members/:id/approve",
  authMiddleware,
  leaderOnly,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", req.params.id)
        .eq("team_id", req.user.teamId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({ message: "Member not found" });
      }

      emitToTeam(req.user.teamId, "memberUpdate", {
        memberId: data.id,
        status: data.status,
      });

      res.json(data);
    } catch (err) {
      console.error("APPROVE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ==================== PRODUCTS ==================== */

app.get("/api/products", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("team_id", req.user.teamId);

    if (error) {
      return res.status(500).json({ message: "Failed to load products" });
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/products", authMiddleware, leaderOnly, async (req, res) => {
  try {
    const { name, quantity, buyPrice, targetPrice } = req.body;
    const qty = Number(quantity);
    const buy = Number(buyPrice);
    const target = Number(targetPrice);

    if (!name || Number.isNaN(qty) || Number.isNaN(buy) || Number.isNaN(target)) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        id: uuidv4(),
        team_id: req.user.teamId,
        name,
        quantity: qty,
        buy_price: buy,
        target_price: target,
      })
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({ message: "Failed to create product" });
    }

    emitToTeam(req.user.teamId, "productUpdate");
    res.json(data);
  } catch (err) {
    console.error("PRODUCT CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== SALES ==================== */

app.post("/api/sales", authMiddleware, async (req, res) => {
  try {
    const { productId, quantity, actualSellPrice } = req.body;
    const qty = Number(quantity);
    const price = Number(actualSellPrice);

    if (!productId || Number.isNaN(qty) || Number.isNaN(price)) {
      return res.status(400).json({ message: "Invalid sale data" });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("team_id", req.user.teamId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (price < product.target_price) {
      return res.status(400).json({ message: "Price below target" });
    }

    if (qty <= 0 || qty > product.quantity) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const profit = (price - product.buy_price) * qty;

    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: product.quantity - qty })
      .eq("id", productId)
      .eq("team_id", req.user.teamId);

    if (updateError) {
      return res.status(500).json({ message: "Failed to update inventory" });
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        id: uuidv4(),
        team_id: req.user.teamId,
        product_id: productId,
        product_name: product.name,
        quantity: qty,
        actual_sell_price: price,
        profit,
        sold_by: req.user.userId,
      })
      .select()
      .single();

    if (saleError || !sale) {
      return res.status(500).json({ message: "Failed to record sale" });
    }

    emitToTeam(req.user.teamId, "productUpdate");
    res.json(sale);
  } catch (err) {
    console.error("SALE ERROR:", err);
    res.status(500).json({ message: "Failed to record sale" });
  }
});

app.get("/api/sales", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("team_id", req.user.teamId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ message: "Failed to load sales" });
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("SALES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== MESSAGES ==================== */

app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, text, created_at, created_by")
      .eq("team_id", req.user.teamId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ message: "Failed to load messages" });
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/messages", authMiddleware, leaderOnly, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Message text required" });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        id: uuidv4(),
        team_id: req.user.teamId,
        text,
        created_by: req.user.userId,
      })
      .select("id, text, created_at, created_by")
      .single();

    if (error || !data) {
      return res.status(500).json({ message: "Failed to send message" });
    }

    emitToTeam(req.user.teamId, "teamMessage", data);
    res.json(data);
  } catch (err) {
    console.error("MESSAGE CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== PROFITS ==================== */

app.post("/api/profits", authMiddleware, leaderOnly, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: "PIN required" });
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("pin")
      .eq("id", req.user.teamId)
      .single();

    if (teamError || !team || team.pin !== pin) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("profit")
      .eq("team_id", req.user.teamId);

    if (salesError) {
      return res.status(500).json({ message: "Failed to load profits" });
    }

    const totalProfit = (sales || []).reduce((sum, s) => sum + s.profit, 0);
    res.json({ totalProfit });
  } catch (err) {
    console.error("PROFITS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== API 404 ==================== */

app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.error("API ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
  next(err);
});

/* ==================== SPA FALLBACK ==================== */

if (NODE_ENV === "production") {
  app.get("*", (_, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
  });
}

/* ==================== START ==================== */

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});