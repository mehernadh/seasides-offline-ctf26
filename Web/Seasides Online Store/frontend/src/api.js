const API_BASE = "";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || "Request failed";
    throw new Error(msg);
  }
  return data;
}
