import { Link, useLocation } from "react-router-dom";
import { getToken, setToken } from "../api";

export default function Navbar() {
  const location = useLocation();
  const token = getToken();

  const handleLogout = () => {
    setToken("");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          ShopX
        </Link>
        <Link
          to="/shop"
          className={
            "nav-link" + (location.pathname === "/shop" ? " active" : "")
          }
        >
          Shop
        </Link>
      </div>
      <div className="nav-right">
        {!token ? (
          <>
            <Link
              to="/login"
              className={
                "nav-link" + (location.pathname === "/login" ? " active" : "")
              }
            >
              Login
            </Link>
            <Link
              to="/register"
              className={
                "nav-link" +
                (location.pathname === "/register" ? " active" : "")
              }
            >
              Sign Up
            </Link>
          </>
        ) : (
          <button className="nav-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
