// frontend/src/pages/Shop.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadAll = async () => {
    try {
      const [prods, meData, cart] = await Promise.all([
        api("/api/products"),
        api("/api/me"),
        api("/api/cart")
      ]);
      setProducts(prods);
      setMe({ ...meData, cart });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (productId) => {
    setError("");
    setMessage("");
    try {
      const data = await api("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId })
      });
      setMessage(data.message || "Added to cart");
      const meData = await api("/api/me");
      const cart = await api("/api/cart");
      setMe({ ...meData, cart });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    setError("");
    setMessage("");
    // setFlag("");
    try {
      // Step 1: INIT
      const init = await api("/api/checkout/init", {
        method: "POST",
        body: JSON.stringify({})
      });

      setMessage(init.message || "Checkout initialized.");
      const confirm = await api("/api/checkout/confirm", {
        method: "POST",
        body: JSON.stringify({ paymentId: init.paymentId })
      });

      setMessage(confirm.message || "Order confirmed.");

      const meData = await api("/api/me");
      const cart = await api("/api/cart");
      setMe({ ...meData, cart });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!me) {
    return (
      <div className="content">
        <p>Loading your account...</p>
      </div>
    );
  }

  const cartItems = me.cart || [];
  let cartTotal = 0;
  cartItems.forEach((item) => {
    const p = products.find((pr) => pr.id === item.productId);
    if (p) cartTotal += p.price * item.quantity;
  });

  return (
    <div className="content">
      <h2>Shop</h2>
      <p className="muted">
        Logged in as <strong>{me.username}</strong> – Balance:{" "}
        <strong>{me.balance}</strong>
      </p>

      <div className="shop-layout">
        <div className="product-list">
          <h3>Products</h3>
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-header">
                <span className="product-name">{p.name}</span>
                <span className="product-price">{p.price} credits</span>
              </div>
              <p className="product-desc">{p.description}</p>
              {p.limited && (
                <span className="badge">Limited – one per account</span>
              )}
              <p className="muted small">Stock: {p.stock}</p>
              <button onClick={() => handleAdd(p.id)}>Add to cart</button>
            </div>
          ))}
        </div>

        <div className="cart-panel">
          <h3>Your Cart</h3>
          {cartItems.length === 0 && (
            <p className="muted">Your cart is empty.</p>
          )}
          {cartItems.length > 0 && (
            <>
              <ul className="cart-items">
                {cartItems.map((item) => {
                  const p = products.find((pr) => pr.id === item.productId);
                  if (!p) return null;
                  return (
                    <li key={item.productId}>
                      <span>
                        {p.name} × {item.quantity}
                      </span>
                      <span>{p.price * item.quantity}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="cart-total">
                <span>Total:</span>
                <span>{cartTotal}</span>
              </div>
              <button className="primary" onClick={handleCheckout}>
                Checkout
              </button>
            </>
          )}

          <h4>Order History</h4>
          {(!me.orders || me.orders.length === 0) && (
            <p className="muted">No orders yet.</p>
          )}
          {me.orders && me.orders.length > 0 && (
            <ul className="orders-list">
              {me.orders.map((o) => (
                <li key={o.id}>
                  <div>Order ID: {o.id}</div>
                  <div>Total: {o.total}</div>
                  <div className="muted small">
                    Placed at: {new Date(o.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message && <div className="info-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}
      {/* Flag is NOT shown in UI anymore */}
      {/* {flag && (
        <div className="flag-banner">
          <strong>Special code:</strong> {flag}
        </div>
      )} */}
    </div>
  );
}
