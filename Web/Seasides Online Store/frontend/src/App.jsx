import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Shop from "./pages/Shop.jsx";
import { getToken } from "./api";

function PrivateRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/shop"
            element={
              <PrivateRoute>
                <Shop />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
