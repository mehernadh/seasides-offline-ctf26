// backend/src/db.js
const bcrypt = require("bcryptjs");

// Products in the shop
// We now add INVENTORY (stock) to simulate overselling under race.
const products = [
  {
    id: "p1",
    name: "Limited Edition Bagpack",
    price: 100,
    limited: true,          // business rule: 1 per account
    stock: 999,               // only 2 exist globally (for all users)
    description: "Exclusive Collection. Limited 1 per Attendee. Very low stock."
  },
  {
    id: "p2",
    name: "Designer T-Shirt",
    price: 30,
    limited: false,
    stock: 999,
    description: "Soft cotton tee with Seasides Logo."
  },
  {
    id: "p3",
    name: "Coffee Mug",
    price: 60,
    limited: false,
    stock: 999,
    description: "Coffee mug with your photo."
  }
];

// Flag for the CTF
const FLAG = "SEASIDES{r4c3_c0nd1t10n_0v3rs3ll_br34k}";

// Users live in memory (fine for CTF)
const users = []; // { username, passwordHash, balance, cart, orders }

// Fake payment “table” (lock-free, just objects in memory)
const payments = []; // { id, username, amount, status }

// Helpers
function findUser(username) {
  return users.find((u) => u.username === username);
}

function createUser(username, password) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    username,
    passwordHash,
    balance: 200,
    cart: [],    // [{ productId, quantity }]
    orders: []   // [{ id, items, total, createdAt, paymentId }]
  };
  users.push(user);
  return user;
}

// Count limited items purchased for a user across orders
function countLimitedItemsPurchased(user) {
  let count = 0;
  for (const order of user.orders) {
    for (const item of order.items) {
      const p = products.find((pr) => pr.id === item.productId);
      if (p && p.limited) {
        count += item.quantity;
      }
    }
  }
  return count;
}

// Find a payment record by id
function findPayment(id) {
  return payments.find((p) => p.id === id);
}

// Create a fake payment intent
function createPayment(username, amount) {
  const id = "pay_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  const payment = {
    id,
    username,
    amount,
    status: "created" // "created" -> "processing" -> "confirmed"
  };
  payments.push(payment);
  return payment;
}

module.exports = {
  products,
  FLAG,
  users,
  findUser,
  createUser,
  countLimitedItemsPurchased,
  payments,
  findPayment,
  createPayment
};
