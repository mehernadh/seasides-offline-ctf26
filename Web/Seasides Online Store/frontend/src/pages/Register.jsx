import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setToken(data.token);
      navigate("/shop");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="content">
      <h2>Create Account</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
        {error && <div className="error-text">{error}</div>}
      </form>
    </div>
  );
}
