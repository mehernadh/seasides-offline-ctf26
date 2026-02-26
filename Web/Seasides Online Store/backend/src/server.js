// backend/src/server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const {
  products,
  FLAG,
  findUser,
  createUser,
  countLimitedItemsPurchased,
  createPayment,
  findPayment
} = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_ctf_key_change_me";

// Random jittered sleep to make timing non-deterministic
function sleepRandom() {
  const base = 400; // minimum 400ms
  const jitter = Math.random() * 900; // + up to 900ms
  const delay = base + jitter;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUser(payload.username);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// --- Auth endpoints ---

// Register
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  if (findUser(username)) {
    return res.status(400).json({ message: "Username already taken" });
  }
  const user = createUser(username, password);
  const token = jwt.sign({ username: user.username }, JWT_SECRET);
  res.json({
    token,
    user: {
      username: user.username,
      balance: user.balance
    }
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = findUser(username);
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    return res.status(400).json({ message: "Invalid username or password" });
  }
  const token = jwt.sign({ username: user.username }, JWT_SECRET);
  res.json({
    token,
    user: {
      username: user.username,
      balance: user.balance
    }
  });
});

// --- Shop endpoints ---

// Get user state
app.get("/api/me", authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    username: user.username,
    balance: user.balance,
    cart: user.cart,
    orders: user.orders
  });
});

// Get products (also show current stock)
app.get("/api/products", authMiddleware, (req, res) => {
  res.json(products);
});

// Get cart
app.get("/api/cart", authMiddleware, (req, res) => {
  res.json(req.user.cart);
});

// Add item to cart
app.post("/api/cart/add", authMiddleware, (req, res) => {
  const user = req.user;
  const { productId } = req.body || {};
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(400).json({ message: "Invalid product" });
  }

  const existing = user.cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    user.cart.push({ productId, quantity: 1 });
  }

  res.json({
    message: "Added to cart",
    cart: user.cart
  });
});

// Clear cart (optional)
app.post("/api/cart/clear", authMiddleware, (req, res) => {
  req.user.cart = [];
  res.json({ message: "Cart cleared" });
});

/**
 * New Very-Hard Design:
 *
 * 1. Client calls POST /api/checkout/init
 *    - Server validates cart, one limited item constraint, stock check (TIME OF CHECK).
 *    - Creates a fake payment intent with amount.
 *    - Returns { paymentId }.
 *
 * 2. Client then calls POST /api/checkout/confirm with { paymentId }
 *    - Here the race-condition + payment state + stock decrement occur (TIME OF USE).
 *    - Two parallel confirm calls can:
 *        - both see inventory as available,
 *        - both mark payment as confirmed,
 *        - both create orders,
 *        - both decrement stock,
 *      leading to oversell + >1 limited item purchased + FLAG.
 */

// INIT checkout – “create payment”
app.post("/api/checkout/init", authMiddleware, (req, res) => {
  const user = req.user;

  if (!user.cart.length) {
    return res.status(400).json({ message: "Your cart is empty." });
  }

  // Calculate totals and limited items in cart
  let total = 0;
  let limitedInCart = 0;
  for (const item of user.cart) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    total += product.price * item.quantity;
    if (product.limited) limitedInCart += item.quantity;
  }

  // Business rule: 1 limited item per checkout
  if (limitedInCart > 1) {
    return res
      .status(400)
      .json({ message: "You may only checkout with one limited item at a time." });
  }

  // Business rule: total limited across all orders must be < 1
  const limitedAlreadyBought = countLimitedItemsPurchased(user);
  if (limitedAlreadyBought >= 1) {
    return res
      .status(400)
      .json({ message: "You have already purchased the limited item." });
  }

  // Global stock check (Time of Check – race vs other users / requests)
  for (const item of user.cart) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (item.quantity > product.stock) {
      return res
        .status(400)
        .json({ message: `Not enough stock for ${product.name}.` });
    }
  }

  if (user.balance < total) {
    return res.status(400).json({ message: "Insufficient balance." });
  }

  // Create fake payment intent
  const payment = createPayment(user.username, total);

  // Client thinks: OK, payment created, now confirm
  return res.json({
    message: "Checkout initialized.",
    paymentId: payment.id,
    amount: total
  });
});

// CONFIRM checkout – this is where the main race happens
app.post("/api/checkout/confirm", authMiddleware, async (req, res) => {
  const user = req.user;
  const { paymentId } = req.body || {};

  if (!paymentId) {
    return res.status(400).json({ message: "paymentId required." });
  }

  const payment = findPayment(paymentId);
  if (!payment || payment.username !== user.username) {
    return res.status(400).json({ message: "Invalid payment session." });
  }

  // If payment already fully confirmed, short-circuit (but still racy if both
  // requests reach this point before status flips).
  if (payment.status === "confirmed") {
    return res.status(400).json({ message: "Payment already confirmed." });
  }

  // Mark as processing (but without any locking).
  // Two threads can both see status != 'confirmed' and set processing.
  payment.status = "processing";

  // Take a SNAPSHOT of the cart at this moment
  const cartSnapshot = user.cart.map((i) => ({ ...i }));

  // Random jittered delay simulating:
  // - network latency,
  // - payment gateway round-trip,
  // - DB processing time.
  await sleepRandom();

  // TIME OF USE (no re-checks – the bug)
  let total = 0;
  let limitedInOrder = 0;
  for (const item of cartSnapshot) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    total += product.price * item.quantity;
    if (product.limited) limitedInOrder += item.quantity;
  }

  // Try to decrement stock NOW (after delay).
  for (const item of cartSnapshot) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (product.stock < item.quantity) {
      return res.status(400).json({
        message: `Stock ran out for ${product.name} during processing.`
      });
    }
    product.stock -= item.quantity;
  }

  // Charge user
  if (user.balance < total) {
    return res.status(400).json({ message: "Balance changed, insufficient." });
  }
  user.balance -= total;

  // Mark payment as confirmed
  payment.status = "confirmed";

  // Create order
  const order = {
    id: "order-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    items: cartSnapshot,
    total,
    createdAt: new Date().toISOString(),
    paymentId: payment.id
  };
  user.orders.push(order);

  // Clear cart for this user
  user.cart = [];

  // Evaluate total limited items AFTER this order
  const totalLimitedAfter = countLimitedItemsPurchased(user);

  const response = {
    message: "Order confirmed.",
    orderId: order.id,
    balance: user.balance
  };

  if (totalLimitedAfter > 1) {
    response.flag = FLAG;
  }

  return res.json(response);
});

// ---- Serve frontend build (for single Render service) ----
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// --- Start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
